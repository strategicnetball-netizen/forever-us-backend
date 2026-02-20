import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Calculate profile health score
router.get('/health-score/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params

    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        questionnaire: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Return a simple score for now
    res.json({
      overallScore: 65,
      scores: {
        completeness: 70,
        engagement: 60,
        authenticity: 65,
        clarity: 60,
        optimization: 65
      },
      tier: 'Good'
    })
  } catch (err) {
    next(err)
  }
})

// Get detailed advice
router.get('/advice/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        questionnaire: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Return basic advice for now
    const advice = {
      photos: [
        { type: 'info', title: 'Add More Photos', message: 'Upload more photos to increase engagement', action: 'Add 2-3 more photos' }
      ],
      bio: [
        { type: 'info', title: 'Expand Your Bio', message: 'Write a more detailed bio about yourself', action: 'Add more personality to your bio' }
      ],
      questionnaire: [
        { type: 'info', title: 'Complete Questionnaire', message: 'Answer all 20 questions for better matches', action: 'Complete your questionnaire' }
      ],
      general: [
        { type: 'success', title: 'Great Start', message: 'Your profile is looking good!', action: null }
      ]
    }

    res.json(advice)
  } catch (err) {
    next(err)
  }
})

// Helper functions for scoring

function calculateCompletenessScore(user, photos) {
  let score = 0

  // Profile fields (40 points)
  if (user.name) score += 10
  if (user.age) score += 10
  if (user.gender) score += 10
  if (user.city) score += 10

  // Bio (20 points)
  if (user.bio && user.bio.length > 50) score += 20
  else if (user.bio && user.bio.length > 20) score += 10

  // Photos (20 points)
  if (photos.length >= 5) score += 20
  else if (photos.length >= 3) score += 15
  else if (photos.length >= 1) score += 10

  // Questionnaire (10 points)
  if (user.questionnaire) score += 10

  return Math.min(score, 100)
}

function calculateEngagementScore(user, photos) {
  let score = 0

  // Bio quality (40 points)
  if (user.bio) {
    const bioLength = user.bio.length
    if (bioLength > 200) score += 40
    else if (bioLength > 100) score += 30
    else if (bioLength > 50) score += 20
    else score += 10
  }

  // Photo quality (30 points)
  if (photos.length >= 4) score += 30
  else if (photos.length >= 3) score += 20
  else if (photos.length >= 2) score += 15
  else if (photos.length >= 1) score += 10

  // Bio sentiment (20 points) - simplified
  if (user.bio && user.bio.length > 50) {
    score += 20
  }

  // Interests mentioned (10 points) - simplified
  if (user.bio && user.bio.length > 100) {
    score += 10
  }

  return Math.min(score, 100)
}

function calculateAuthenticityScore(user, photos) {
  let score = 50

  // Photo consistency (30 points)
  if (photos.length >= 3) score += 20
  else if (photos.length >= 2) score += 10

  // Bio-profile alignment (20 points)
  if (user.bio && user.name) {
    score += 20
  }

  return Math.min(Math.max(score, 0), 100)
}

function calculateClarityScore(user) {
  let score = 0

  // Intentions clarity (40 points)
  if (user.bio && user.bio.length > 30) {
    score += 40
  }

  // Dealbreakers mentioned (30 points)
  if (user.bio && user.bio.length > 50) {
    score += 30
  }

  // Interests highlighted (20 points)
  if (user.bio && user.bio.length > 80) {
    score += 20
  }

  // Bio readability (10 points)
  if (user.bio && user.bio.length > 50 && user.bio.length < 300) {
    score += 10
  }

  return Math.min(score, 100)
}

function calculateOptimizationScore(user) {
  let score = 0

  // Keyword usage (40 points)
  if (user.bio && user.bio.length > 50) {
    score += 40
  }

  // Profile freshness (30 points)
  if (user.updatedAt) {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(user.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceUpdate < 7) score += 30
    else if (daysSinceUpdate < 30) score += 20
    else if (daysSinceUpdate < 90) score += 10
  }

  // Activity level (20 points)
  if (user.lastSignInDate) {
    const daysSinceLogin = Math.floor((Date.now() - new Date(user.lastSignInDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLogin < 1) score += 20
    else if (daysSinceLogin < 7) score += 15
    else if (daysSinceLogin < 30) score += 10
  }

  // Tier status (10 points)
  if (user.tier === 'vip') score += 10
  else if (user.tier === 'premium') score += 5

  return Math.min(score, 100)
}

function getScoreTier(score) {
  if (score >= 90) return 'Perfect'
  if (score >= 75) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 45) return 'Fair'
  return 'Needs Work'
}

// Advice generation functions

function getPhotoAdvice(user, photos) {
  const advice = []

  // Photo count advice
  if (photos.length === 0) {
    advice.push({
      type: 'critical',
      title: 'Add Photos',
      message: 'You have no photos yet. Members with photos get 5x more engagement!',
      action: 'Upload at least 4 photos to your profile'
    })
  } else if (photos.length < 3) {
    advice.push({
      type: 'warning',
      title: 'Add More Photos',
      message: `You have ${photos.length} photo(s). Members with 4+ photos get 3x more likes.`,
      action: `Add ${4 - photos.length} more photos`
    })
  } else if (photos.length >= 4) {
    advice.push({
      type: 'success',
      title: 'Great Photo Count',
      message: 'You have a good number of photos! This increases engagement.',
      action: null
    })
  }

  // Photo diversity advice
  if (photos.length >= 2) {
    advice.push({
      type: 'info',
      title: 'Photo Diversity',
      message: 'Include a mix of selfies, full-body shots, and hobby/interest photos.',
      action: 'Consider adding a photo showing your interests or hobbies'
    })
  }

  // Photo freshness advice
  if (user.updatedAt) {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(user.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceUpdate > 90) {
      advice.push({
        type: 'warning',
        title: 'Update Your Photos',
        message: 'Your photos are older than 3 months. Recent photos get 2x more engagement.',
        action: 'Upload fresh photos to boost your profile'
      })
    }
  }

  return advice
}

function getBioAdvice(user) {
  const advice = []

  if (!user.bio) {
    advice.push({
      type: 'critical',
      title: 'Add a Bio',
      message: 'Your profile has no bio. A good bio increases engagement by 50%!',
      action: 'Write a bio describing yourself and what you\'re looking for'
    })
    return advice
  }

  // Bio length advice
  if (user.bio.length < 50) {
    advice.push({
      type: 'warning',
      title: 'Expand Your Bio',
      message: 'Your bio is too short. Detailed bios get more engagement.',
      action: 'Add more details about yourself and your interests'
    })
  } else if (user.bio.length > 300) {
    advice.push({
      type: 'info',
      title: 'Bio Length',
      message: 'Your bio is quite long. Consider condensing for better readability.',
      action: 'Edit your bio to be more concise'
    })
  } else {
    advice.push({
      type: 'success',
      title: 'Good Bio Length',
      message: 'Your bio length is perfect for engagement.',
      action: null
    })
  }

  // Tone advice
  const positiveWords = ['love', 'enjoy', 'passionate', 'excited', 'amazing', 'great', 'wonderful', 'fun']
  const negativeWords = ['hate', 'don\'t', 'avoid', 'boring', 'terrible', 'awful']
  const positiveCount = positiveWords.filter(word => user.bio.toLowerCase().includes(word)).length
  const negativeCount = negativeWords.filter(word => user.bio.toLowerCase().includes(word)).length

  if (negativeCount > positiveCount) {
    advice.push({
      type: 'warning',
      title: 'Positive Tone',
      message: 'Try using more positive language. Positive bios attract more matches.',
      action: 'Reframe negative statements in a positive way'
    })
  } else if (positiveCount > 0) {
    advice.push({
      type: 'success',
      title: 'Positive Tone',
      message: 'Your bio has a positive, friendly tone. Great!',
      action: null
    })
  }

  // Interests advice
  const interestKeywords = ['travel', 'hiking', 'cooking', 'reading', 'sports', 'music', 'art', 'fitness', 'gaming', 'movies']
  const mentionedInterests = interestKeywords.filter(keyword => user.bio.toLowerCase().includes(keyword)).length

  if (mentionedInterests === 0) {
    advice.push({
      type: 'warning',
      title: 'Add Interests',
      message: 'Mention your interests! Popular interests: travel, hiking, cooking, fitness.',
      action: 'Add 2-3 specific interests to your bio'
    })
  } else if (mentionedInterests === 1) {
    advice.push({
      type: 'info',
      title: 'Add More Interests',
      message: 'You mention 1 interest. Adding more helps attract compatible matches.',
      action: 'Add 1-2 more interests'
    })
  } else {
    advice.push({
      type: 'success',
      title: 'Good Interest Coverage',
      message: `You mention ${mentionedInterests} interests. This helps attract compatible matches!`,
      action: null
    })
  }

  return advice
}

function getQuestionnaireAdvice(user) {
  const advice = []

  if (!user.questionnaire) {
    advice.push({
      type: 'critical',
      title: 'Complete Questionnaire',
      message: 'You haven\'t completed the questionnaire. Detailed answers get 2x more engagement!',
      action: 'Complete all 20 questionnaire questions'
    })
    return advice
  }

  try {
    const answers = JSON.parse(user.questionnaire.answers)
    const answeredCount = Object.keys(answers).length

    if (answeredCount < 20) {
      advice.push({
        type: 'warning',
        title: 'Complete Questionnaire',
        message: `You've answered ${answeredCount}/20 questions. Complete all for better matches.`,
        action: `Answer the remaining ${20 - answeredCount} questions`
      })
    } else {
      advice.push({
        type: 'success',
        title: 'Questionnaire Complete',
        message: 'You\'ve completed all 20 questions. Great!',
        action: null
      })
    }

    // Check for thoughtful answers
    let thoughtfulCount = 0
    Object.values(answers).forEach(answer => {
      if (typeof answer === 'string' && answer.length > 20) thoughtfulCount++
    })

    if (thoughtfulCount < 5) {
      advice.push({
        type: 'info',
        title: 'Add More Detail',
        message: 'Your answers could be more detailed. Show your personality!',
        action: 'Review and expand your text answers with more personality'
      })
    } else {
      advice.push({
        type: 'success',
        title: 'Thoughtful Answers',
        message: 'Your answers are detailed and show personality. Excellent!',
        action: null
      })
    }
  } catch (e) {
    advice.push({
      type: 'warning',
      title: 'Questionnaire Issue',
      message: 'There was an issue reading your questionnaire. Please review it.',
      action: 'Check your questionnaire answers'
    })
  }

  return advice
}

function getGeneralAdvice(user, photos) {
  const advice = []

  // Profile completeness
  const completenessScore = calculateCompletenessScore(user, photos)
  if (completenessScore < 60) {
    advice.push({
      type: 'warning',
      title: 'Complete Your Profile',
      message: 'Your profile is incomplete. Complete profiles get 3x more engagement.',
      action: 'Fill in all profile fields: name, age, gender, location, bio, photos'
    })
  }

  // Activity advice
  if (user.lastSignInDate) {
    const daysSinceLogin = Math.floor((Date.now() - new Date(user.lastSignInDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLogin > 7) {
      advice.push({
        type: 'info',
        title: 'Stay Active',
        message: 'Active members get more engagement. Log in regularly!',
        action: 'Visit the app regularly to increase visibility'
      })
    }
  }

  return advice
}

export default router
