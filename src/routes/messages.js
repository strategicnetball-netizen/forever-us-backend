import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { getPointsCost } from '../utils/constants.js';
import { canMessage, incrementMessageCount } from '../utils/dailyLimits.js';
import { getIO } from '../services/socketService.js';

const router = express.Router();

router.post('/send', authenticate, async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Missing receiverId or content' });
    }
    
    // Check daily message limit
    const limitCheck = await canMessage(prisma, req.userId);
    
    // Get sender info for points check
    const sender = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { points: true, tier: true }
    });
    
    if (!sender) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If limit reached and not premium, check if they can spend coins
    if (!limitCheck.canMessage && sender.tier !== 'premium') {
      // Cost to bypass limit: 5 coins per message
      const bypassCost = 5;
      if (sender.points < bypassCost) {
        return res.status(429).json({ 
          error: 'Daily message limit reached. Purchase coins to continue.',
          limitReached: true,
          remaining: 0,
          limit: limitCheck.limit,
          bypassCost,
          userPoints: sender.points
        });
      }
      // User has enough coins, allow them to proceed (will deduct coins below)
    } else if (!limitCheck.canMessage) {
      // Premium users shouldn't hit this, but just in case
      return res.status(429).json({ 
        error: limitCheck.error,
        limitReached: true,
        remaining: limitCheck.remaining,
        limit: limitCheck.limit
      });
    }
    
    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });
    
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }
    
    // Get points cost based on tier
    const pointsCost = getPointsCost(sender.tier, 'message');
    
    // Check if user has enough points for the action itself
    if (sender.points < pointsCost) {
      return res.status(400).json({ 
        error: `Insufficient points. Need ${pointsCost} points to send a message.` 
      });
    }
    
    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: req.userId,
        receiverId,
        content,
        pointsCost
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });
    
    // Increment message counter
    await incrementMessageCount(prisma, req.userId);
    
    // Deduct points if cost > 0
    let updatedUser = sender;
    if (pointsCost > 0) {
      updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: { points: { decrement: pointsCost } }
      });
      
      // Record transaction
      await prisma.pointsTransaction.create({
        data: {
          userId: req.userId,
          amount: -pointsCost,
          type: 'message_sent',
          reason: `Message to ${receiver.name}`
        }
      });
    }
    
    // Emit real-time message to receiver through Socket.io
    const io = getIO();
    if (io) {
      io.emit('message:new', {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        createdAt: message.createdAt,
        sender: message.sender
      });
    }
    
    res.status(201).json({
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt
      },
      pointsRemaining: updatedUser.points,
      pointsCost
    });
  } catch (err) {
    next(err);
  }
});

router.get('/inbox', authenticate, async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: { receiverId: req.userId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

router.get('/sent', authenticate, async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: { senderId: req.userId },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

router.post('/analyze', authenticate, async (req, res, next) => {
  try {
    const { content, recipientName } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Missing content' });
    }
    
    const analysis = analyzeMessage(content, recipientName);
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

// Mark message as read
router.put('/:messageId/read', authenticate, async (req, res, next) => {
  try {
    const { messageId } = req.params;
    
    // Verify the user is the receiver
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.receiverId !== req.userId) {
      return res.status(403).json({ error: 'You can only mark your own messages as read' });
    }
    
    // Mark as read
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        read: true,
        readAt: new Date()
      }
    });
    
    res.json(updatedMessage);
  } catch (err) {
    next(err);
  }
});

function analyzeMessage(content, recipientName = '') {
  const scores = {};
  const suggestions = [];
  let totalScore = 0;
  
  // 1. Length analysis (optimal: 50-200 chars)
  const length = content.length;
  if (length < 20) {
    scores.length = 20;
    suggestions.push('💬 Message is too short. Add more detail to increase reply chances.');
  } else if (length < 50) {
    scores.length = 60;
    suggestions.push('💬 Consider adding a bit more detail to your message.');
  } else if (length <= 200) {
    scores.length = 100;
  } else if (length <= 300) {
    scores.length = 90;
    suggestions.push('📝 Message is getting long. Consider being more concise.');
  } else {
    scores.length = 70;
    suggestions.push('📝 Message is quite long. People are more likely to reply to shorter, focused messages.');
  }
  
  // 2. Question count (1-2 questions optimal)
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount === 0) {
    scores.questions = 60;
    suggestions.push('❓ Add a question to encourage a response.');
  } else if (questionCount === 1 || questionCount === 2) {
    scores.questions = 100;
  } else if (questionCount <= 4) {
    scores.questions = 80;
    suggestions.push('❓ Too many questions might overwhelm. Stick to 1-2 questions.');
  } else {
    scores.questions = 50;
    suggestions.push('❓ Way too many questions! Keep it to 1-2 to get better replies.');
  }
  
  // 3. Emoji usage (1-2 emojis optimal)
  const emojiRegex = /(\u00d7|\u20e3|[\u2600-\u27BF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2300-\u23FF]|[\u2000-\u206F]|[\u2700-\u27BF])/g;
  const emojiCount = (content.match(emojiRegex) || []).length;
  if (emojiCount === 0) {
    scores.emoji = 80;
    suggestions.push('😊 Adding 1-2 emojis can make your message feel friendlier.');
  } else if (emojiCount === 1 || emojiCount === 2) {
    scores.emoji = 100;
  } else if (emojiCount <= 4) {
    scores.emoji = 80;
    suggestions.push('😊 A couple fewer emojis would look better.');
  } else {
    scores.emoji = 50;
    suggestions.push('😊 Too many emojis can look spammy. Use 1-2 instead.');
  }
  
  // 4. Personalization (mentions recipient name)
  let personalizationScore = 70;
  if (recipientName && content.toLowerCase().includes(recipientName.toLowerCase())) {
    personalizationScore = 100;
  } else if (recipientName) {
    suggestions.push(`👤 Try mentioning ${recipientName}'s name to make it more personal.`);
  }
  scores.personalization = personalizationScore;
  
  // 5. Tone analysis (positive indicators)
  const positiveWords = ['love', 'great', 'amazing', 'awesome', 'beautiful', 'wonderful', 'interested', 'excited', 'fun', 'enjoy', 'like', 'appreciate'];
  const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'boring', 'stupid', 'ugly', 'disgusting'];
  
  const contentLower = content.toLowerCase();
  const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
  const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
  
  if (negativeCount > 0) {
    scores.tone = 40;
    suggestions.push('😟 Avoid negative language. Keep your message positive and friendly.');
  } else if (positiveCount >= 2) {
    scores.tone = 100;
  } else if (positiveCount === 1) {
    scores.tone = 85;
  } else {
    scores.tone = 70;
    suggestions.push('😊 Add some positive language to make your message more engaging.');
  }
  
  // Calculate overall score
  totalScore = Math.round(
    (scores.length * 0.25 + 
     scores.questions * 0.25 + 
     scores.emoji * 0.15 + 
     scores.personalization * 0.20 + 
     scores.tone * 0.15)
  );
  
  return {
    overallScore: totalScore,
    breakdown: {
      length: scores.length,
      questions: scores.questions,
      emoji: scores.emoji,
      personalization: scores.personalization,
      tone: scores.tone
    },
    suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
    metrics: {
      length,
      questionCount,
      emojiCount,
      hasPositiveLanguage: positiveCount > 0,
      hasNegativeLanguage: negativeCount > 0
    }
  };
}

export default router;
