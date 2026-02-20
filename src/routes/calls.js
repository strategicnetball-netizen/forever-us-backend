import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { getIO, getActiveUsers } from '../services/socketService.js';

const router = express.Router();

// Check if user can initiate a call
router.get('/can-call/:recipientId', authenticate, async (req, res, next) => {
  try {
    const { recipientId } = req.params;
    const userId = req.userId;

    // Get caller's tier
    const caller = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true }
    });

    if (!caller) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recipient's tier
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { tier: true }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Free members cannot make any calls
    if (caller.tier === 'free') {
      return res.json({
        canVoiceCall: false,
        canVideoCall: false,
        reason: 'Upgrade to Premium or VIP to use voice and video chat'
      });
    }

    // Check if recipient can receive calls (only premium and vip can)
    if (recipient.tier === 'free') {
      return res.json({
        canVoiceCall: false,
        canVideoCall: false,
        reason: 'This user cannot receive calls'
      });
    }

    // Premium members can only make voice calls
    if (caller.tier === 'premium') {
      return res.json({
        canVoiceCall: true,
        canVideoCall: false,
        reason: 'Upgrade to VIP for video chat'
      });
    }

    // VIP members can make both voice and video calls
    if (caller.tier === 'vip') {
      return res.json({
        canVoiceCall: true,
        canVideoCall: true,
        reason: null
      });
    }

    return res.json({
      canVoiceCall: false,
      canVideoCall: false,
      reason: 'Unable to determine call permissions'
    });
  } catch (err) {
    next(err);
  }
});

// Request a call (send permission request)
router.post('/request-call', authenticate, async (req, res, next) => {
  try {
    const { recipientId, callType } = req.body;
    const userId = req.userId;

    // Validate call type
    if (!['voice', 'video'].includes(callType)) {
      return res.status(400).json({ error: 'Invalid call type' });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Check if caller and recipient are not the same
    if (userId === recipientId) {
      return res.status(400).json({ error: 'Cannot call yourself' });
    }

    // Check if caller is blocked by recipient
    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        blockerId: recipientId,
        blockedId: userId
      }
    });

    if (isBlocked) {
      return res.status(403).json({ error: 'You have been blocked by this user' });
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.callRequest.findFirst({
      where: {
        callerId: userId,
        recipientId: recipientId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Call request already pending' });
    }

    // Create call request
    const callRequest = await prisma.callRequest.create({
      data: {
        callerId: userId,
        recipientId: recipientId,
        callType: callType,
        status: 'pending',
        createdAt: new Date()
      }
    });

    res.json({ success: true, callRequestId: callRequest.id });
  } catch (err) {
    next(err);
  }
});

// Get pending call requests for current user
router.get('/pending-requests', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;

    const requests = await prisma.callRequest.findMany({
      where: {
        recipientId: userId,
        status: 'pending'
      },
      include: {
        caller: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Accept or reject a call request
router.post('/respond-request', authenticate, async (req, res, next) => {
  try {
    const { callRequestId, accepted } = req.body;
    const userId = req.userId;

    if (!['true', 'false', true, false].includes(accepted)) {
      return res.status(400).json({ error: 'Invalid response' });
    }

    // Get the call request
    const callRequest = await prisma.callRequest.findUnique({
      where: { id: callRequestId }
    });

    if (!callRequest) {
      return res.status(404).json({ error: 'Call request not found' });
    }

    // Verify the user is the recipient
    if (callRequest.recipientId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update the call request status
    const status = accepted ? 'accepted' : 'rejected';
    const updatedRequest = await prisma.callRequest.update({
      where: { id: callRequestId },
      data: { status: status }
    });

    // If rejected, check if we need to auto-block
    if (status === 'rejected') {
      const rejectedCount = await prisma.callRequest.count({
        where: {
          callerId: callRequest.callerId,
          recipientId: userId,
          status: 'rejected'
        }
      });

      // Auto-block after 2 rejections
      if (rejectedCount >= 2) {
        // Check if already blocked
        const existingBlock = await prisma.blockedUser.findFirst({
          where: {
            blockerId: userId,
            blockedId: callRequest.callerId
          }
        });

        if (!existingBlock) {
          await prisma.blockedUser.create({
            data: {
              blockerId: userId,
              blockedId: callRequest.callerId
            }
          });
          console.log(`Auto-blocked ${callRequest.callerId} after 2 rejected calls from ${userId}`);
        }
      }
    }

    // Notify caller via Socket.io
    const io = getIO();
    const activeUsers = getActiveUsers();
    const callerSocketId = activeUsers.get(callRequest.callerId);
    
    if (callerSocketId && io) {
      if (status === 'rejected') {
        io.to(callerSocketId).emit('call:rejected', { callRequestId })
      } else if (status === 'accepted') {
        io.to(callerSocketId).emit('call:accepted', { callRequestId })
      }
    }

    res.json({ success: true, status: status });
  } catch (err) {
    next(err);
  }
});

// Log call attempt (for analytics)
router.post('/log-call', authenticate, async (req, res, next) => {
  try {
    const { recipientId, callType, duration } = req.body;
    const userId = req.userId;

    // Validate call type
    if (!['voice', 'video'].includes(callType)) {
      return res.status(400).json({ error: 'Invalid call type' });
    }

    // In a real app, you might store this for analytics
    console.log(`Call logged: ${userId} -> ${recipientId} (${callType}, ${duration}s)`);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
