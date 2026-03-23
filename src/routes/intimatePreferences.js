import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Moderation keywords - illegal/inappropriate content
const BANNED_KEYWORDS = [
  'minor', 'child', 'kid', 'teen', 'underage', 'young',
  'animal', 'pet', 'dog', 'cat', 'horse',
  'non-consent', 'rape', 'force', 'coerce',
  'contact', 'phone', 'email', 'address', 'instagram', 'snapchat', 'whatsapp'
]

// Helper function to check for banned content
function containsBannedContent(text) {
  if (!text) return false
  const lowerText = text.toLowerCase()
  return BANNED_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

// Helper function to validate preferences
function validatePreferences(data) {
  const errors = []
  
  if (data.customNotes && data.customNotes.length > 500) {
    errors.push('Custom notes must be 500 characters or less')
  }
  
  if (data.customNotes && containsBannedContent(data.customNotes)) {
    errors.push('Custom notes contain inappropriate content')
  }
  
  return errors
}

// ===== AGREEMENT ROUTES (MUST BE BEFORE /:userId ROUTE) =====

// POST /api/intimate-preferences/agreement - Record user agreement
router.post('/agreement', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    
    // Check age requirement (21+)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { age: true }
    })
    
    if (!user || user.age < 21) {
      return res.status(403).json({ error: 'Must be 21+ to agree to intimate preferences' })
    }
    
    // Record agreement
    await prisma.user.update({
      where: { id: userId },
      data: {
        intimatePreferencesAgreed: true,
        intimatePreferencesAgreedAt: new Date()
      }
    })
    
    res.json({ message: 'Agreement recorded successfully' })
  } catch (error) {
    console.error('Record agreement error:', error)
    res.status(500).json({ error: 'Failed to record agreement' })
  }
})

// GET /api/intimate-preferences/agreement - Check if user has agreed
router.get('/agreement', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        age: true,
        intimatePreferencesAgreed: true,
        intimatePreferencesAgreedAt: true
      }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({
      hasAgreed: user.intimatePreferencesAgreed || false,
      agreedAt: user.intimatePreferencesAgreedAt,
      isEligible: user.age >= 21
    })
  } catch (error) {
    console.error('Get agreement error:', error)
    res.status(500).json({ error: 'Failed to check agreement' })
  }
})

// GET /api/intimate-preferences/privacy-settings - Get user's privacy settings
router.get('/privacy-settings', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        wantToSeeIntimatePreferences: true
      }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({
      wantToSeeIntimatePreferences: user.wantToSeeIntimatePreferences
    })
  } catch (error) {
    console.error('Get privacy settings error:', error)
    res.status(500).json({ error: 'Failed to fetch privacy settings' })
  }
})

// PUT /api/intimate-preferences/privacy-settings - Update user's privacy settings
router.put('/privacy-settings', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { wantToSeeIntimatePreferences } = req.body
    
    if (typeof wantToSeeIntimatePreferences !== 'boolean') {
      return res.status(400).json({ error: 'wantToSeeIntimatePreferences must be a boolean' })
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        wantToSeeIntimatePreferences
      },
      select: {
        wantToSeeIntimatePreferences: true
      }
    })
    
    res.json({
      message: 'Privacy settings updated successfully',
      wantToSeeIntimatePreferences: user.wantToSeeIntimatePreferences
    })
  } catch (error) {
    console.error('Update privacy settings error:', error)
    res.status(500).json({ error: 'Failed to update privacy settings' })
  }
})

// ===== PREFERENCES ROUTES =====

// GET /api/intimate-preferences - Get current user's preferences
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    
    // Check age requirement (21+)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { age: true }
    })
    
    if (!user || user.age < 21) {
      return res.status(403).json({ error: 'Must be 21+ to access intimate preferences' })
    }
    
    const preferences = await prisma.intimatePreferences.findUnique({
      where: { userId }
    })
    
    if (!preferences) {
      return res.status(404).json({ error: 'No preferences found' })
    }
    
    // Parse JSON fields
    const parsed = {
      ...preferences,
      dominanceSubmission: preferences.dominanceSubmission ? JSON.parse(preferences.dominanceSubmission) : null,
      bondage: preferences.bondage ? JSON.parse(preferences.bondage) : null,
      roleplay: preferences.roleplay ? JSON.parse(preferences.roleplay) : null,
      voyeurism: preferences.voyeurism ? JSON.parse(preferences.voyeurism) : null,
      communicationStyle: preferences.communicationStyle ? JSON.parse(preferences.communicationStyle) : null,
      boundaries: preferences.boundaries ? JSON.parse(preferences.boundaries) : null,
      frequency: preferences.frequency ? JSON.parse(preferences.frequency) : null
    }
    
    res.json(parsed)
  } catch (error) {
    console.error('Get preferences error:', error)
    res.status(500).json({ error: 'Failed to fetch preferences' })
  }
})

// POST /api/intimate-preferences - Create/update preferences
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const {
      dominanceSubmission,
      bondage,
      roleplay,
      voyeurism,
      communicationStyle,
      boundaries,
      frequency,
      customNotes,
      isPublic
    } = req.body
    
    // Check age requirement (21+)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { age: true }
    })
    
    if (!user || user.age < 21) {
      return res.status(403).json({ error: 'Must be 21+ to set intimate preferences' })
    }
    
    // Validate preferences
    const validationErrors = validatePreferences({ customNotes })
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors })
    }
    
    // Check if flagged for review
    const flaggedForReview = containsBannedContent(customNotes)
    
    // Upsert preferences
    const preferences = await prisma.intimatePreferences.upsert({
      where: { userId },
      update: {
        dominanceSubmission: dominanceSubmission ? JSON.stringify(dominanceSubmission) : null,
        bondage: bondage ? JSON.stringify(bondage) : null,
        roleplay: roleplay ? JSON.stringify(roleplay) : null,
        voyeurism: voyeurism ? JSON.stringify(voyeurism) : null,
        communicationStyle: communicationStyle ? JSON.stringify(communicationStyle) : null,
        boundaries: boundaries ? JSON.stringify(boundaries) : null,
        frequency: frequency ? JSON.stringify(frequency) : null,
        customNotes,
        isPublic: isPublic ?? false,
        flaggedForReview,
        updatedAt: new Date()
      },
      create: {
        userId,
        dominanceSubmission: dominanceSubmission ? JSON.stringify(dominanceSubmission) : null,
        bondage: bondage ? JSON.stringify(bondage) : null,
        roleplay: roleplay ? JSON.stringify(roleplay) : null,
        voyeurism: voyeurism ? JSON.stringify(voyeurism) : null,
        communicationStyle: communicationStyle ? JSON.stringify(communicationStyle) : null,
        boundaries: boundaries ? JSON.stringify(boundaries) : null,
        frequency: frequency ? JSON.stringify(frequency) : null,
        customNotes,
        isPublic: isPublic ?? false,
        flaggedForReview
      }
    })
    
    // Parse JSON fields for response
    const parsed = {
      ...preferences,
      dominanceSubmission: preferences.dominanceSubmission ? JSON.parse(preferences.dominanceSubmission) : null,
      bondage: preferences.bondage ? JSON.parse(preferences.bondage) : null,
      roleplay: preferences.roleplay ? JSON.parse(preferences.roleplay) : null,
      voyeurism: preferences.voyeurism ? JSON.parse(preferences.voyeurism) : null,
      communicationStyle: preferences.communicationStyle ? JSON.parse(preferences.communicationStyle) : null,
      boundaries: preferences.boundaries ? JSON.parse(preferences.boundaries) : null,
      frequency: preferences.frequency ? JSON.parse(preferences.frequency) : null
    }
    
    res.json({
      message: 'Preferences saved successfully',
      preferences: parsed,
      flaggedForReview: flaggedForReview ? 'Content flagged for moderation review' : null
    })
  } catch (error) {
    console.error('Save preferences error:', error)
    res.status(500).json({ error: 'Failed to save preferences' })
  }
})

// GET /api/intimate-preferences/:userId - Get another user's preferences (if authorized)
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const currentUserId = req.userId
    const targetUserId = req.params.userId
    
    // Check if users are matched (mutual likes)
    const match = await prisma.like.findUnique({
      where: {
        likerId_likedId: {
          likerId: currentUserId,
          likedId: targetUserId
        }
      }
    })
    
    const reverseMatch = await prisma.like.findUnique({
      where: {
        likerId_likedId: {
          likerId: targetUserId,
          likedId: currentUserId
        }
      }
    })
    
    if (!match || !reverseMatch) {
      return res.status(403).json({ error: 'You must be matched to view preferences' })
    }
    
    // Check if current user wants to see intimate preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { wantToSeeIntimatePreferences: true }
    })
    
    if (!currentUser.wantToSeeIntimatePreferences) {
      return res.status(403).json({ error: 'You have disabled viewing intimate preferences' })
    }
    
    // Get preferences
    const preferences = await prisma.intimatePreferences.findUnique({
      where: { userId: targetUserId }
    })
    
    if (!preferences) {
      return res.status(404).json({ error: 'User has not set preferences' })
    }
    
    // Check if user wants to share preferences
    if (!preferences.isPublic) {
      return res.status(403).json({ error: 'User has not shared preferences' })
    }
    
    // Parse JSON fields
    const parsed = {
      ...preferences,
      dominanceSubmission: preferences.dominanceSubmission ? JSON.parse(preferences.dominanceSubmission) : null,
      bondage: preferences.bondage ? JSON.parse(preferences.bondage) : null,
      roleplay: preferences.roleplay ? JSON.parse(preferences.roleplay) : null,
      voyeurism: preferences.voyeurism ? JSON.parse(preferences.voyeurism) : null,
      communicationStyle: preferences.communicationStyle ? JSON.parse(preferences.communicationStyle) : null,
      boundaries: preferences.boundaries ? JSON.parse(preferences.boundaries) : null,
      frequency: preferences.frequency ? JSON.parse(preferences.frequency) : null
    }
    
    res.json(parsed)
  } catch (error) {
    console.error('Get user preferences error:', error)
    res.status(500).json({ error: 'Failed to fetch preferences' })
  }
})

// DELETE /api/intimate-preferences - Delete preferences
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    
    await prisma.intimatePreferences.delete({
      where: { userId }
    })
    
    res.json({ message: 'Preferences deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'No preferences found to delete' })
    }
    console.error('Delete preferences error:', error)
    res.status(500).json({ error: 'Failed to delete preferences' })
  }
})

// POST /api/intimate-preferences/report - Report inappropriate content
router.post('/report', authenticate, async (req, res) => {
  try {
    const { userId, reason } = req.body
    
    if (!userId || !reason) {
      return res.status(400).json({ error: 'userId and reason are required' })
    }
    
    // Flag for review
    await prisma.intimatePreferences.update({
      where: { userId },
      data: {
        flaggedForReview: true,
        moderationNotes: `Reported by user: ${reason}`
      }
    })
    
    res.json({ message: 'Content reported successfully' })
  } catch (error) {
    console.error('Report preferences error:', error)
    res.status(500).json({ error: 'Failed to report content' })
  }
})

export default router
