// Utility functions for managing daily limits

const DAILY_LIKE_LIMIT = 5
const DAILY_MESSAGE_LIMIT = 10

/**
 * Check if daily limit needs to be reset (new day)
 */
function shouldResetLimit(lastResetDate) {
  if (!lastResetDate) return true
  
  const lastReset = new Date(lastResetDate)
  const now = new Date()
  
  // Reset if different day (UTC)
  return lastReset.toDateString() !== now.toDateString()
}

/**
 * Get remaining likes for user
 */
async function getLikesRemaining(user) {
  if (user.tier === 'premium') {
    return { remaining: Infinity, limit: Infinity, isPremium: true }
  }
  
  if (shouldResetLimit(user.lastLikeResetDate)) {
    return { remaining: DAILY_LIKE_LIMIT, limit: DAILY_LIKE_LIMIT, isPremium: false }
  }
  
  const remaining = Math.max(0, DAILY_LIKE_LIMIT - user.likesUsedToday)
  return { remaining, limit: DAILY_LIKE_LIMIT, isPremium: false }
}

/**
 * Get remaining messages for user
 */
async function getMessagesRemaining(user) {
  if (user.tier === 'premium') {
    return { remaining: Infinity, limit: Infinity, isPremium: true }
  }
  
  if (shouldResetLimit(user.lastMessageResetDate)) {
    return { remaining: DAILY_MESSAGE_LIMIT, limit: DAILY_MESSAGE_LIMIT, isPremium: false }
  }
  
  const remaining = Math.max(0, DAILY_MESSAGE_LIMIT - user.messagesUsedToday)
  return { remaining, limit: DAILY_MESSAGE_LIMIT, isPremium: false }
}

/**
 * Check if user can like (and reset if needed)
 */
async function canLike(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, likesUsedToday: true, lastLikeResetDate: true }
  })
  
  if (!user) return { canLike: false, error: 'User not found' }
  
  // Premium users can always like
  if (user.tier === 'premium') {
    return { canLike: true, remaining: Infinity }
  }
  
  // Check if we need to reset
  if (shouldResetLimit(user.lastLikeResetDate)) {
    // Reset the counter
    await prisma.user.update({
      where: { id: userId },
      data: {
        likesUsedToday: 0,
        lastLikeResetDate: new Date()
      }
    })
    return { canLike: true, remaining: DAILY_LIKE_LIMIT }
  }
  
  // Check if limit reached
  if (user.likesUsedToday >= DAILY_LIKE_LIMIT) {
    return { 
      canLike: false, 
      error: 'Daily like limit reached',
      remaining: 0,
      limit: DAILY_LIKE_LIMIT
    }
  }
  
  return { canLike: true, remaining: DAILY_LIKE_LIMIT - user.likesUsedToday }
}

/**
 * Check if user can message (and reset if needed)
 */
async function canMessage(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, messagesUsedToday: true, lastMessageResetDate: true }
  })
  
  if (!user) return { canMessage: false, error: 'User not found' }
  
  // Premium users can always message
  if (user.tier === 'premium') {
    return { canMessage: true, remaining: Infinity }
  }
  
  // Check if we need to reset
  if (shouldResetLimit(user.lastMessageResetDate)) {
    // Reset the counter
    await prisma.user.update({
      where: { id: userId },
      data: {
        messagesUsedToday: 0,
        lastMessageResetDate: new Date()
      }
    })
    return { canMessage: true, remaining: DAILY_MESSAGE_LIMIT }
  }
  
  // Check if limit reached
  if (user.messagesUsedToday >= DAILY_MESSAGE_LIMIT) {
    return { 
      canMessage: false, 
      error: 'Daily message limit reached',
      remaining: 0,
      limit: DAILY_MESSAGE_LIMIT
    }
  }
  
  return { canMessage: true, remaining: DAILY_MESSAGE_LIMIT - user.messagesUsedToday }
}

/**
 * Increment like counter
 */
async function incrementLikeCount(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { likesUsedToday: true, lastLikeResetDate: true }
  })
  
  // Reset if new day
  if (shouldResetLimit(user.lastLikeResetDate)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        likesUsedToday: 1,
        lastLikeResetDate: new Date()
      }
    })
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { likesUsedToday: user.likesUsedToday + 1 }
    })
  }
}

/**
 * Increment message counter
 */
async function incrementMessageCount(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { messagesUsedToday: true, lastMessageResetDate: true }
  })
  
  // Reset if new day
  if (shouldResetLimit(user.lastMessageResetDate)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        messagesUsedToday: 1,
        lastMessageResetDate: new Date()
      }
    })
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { messagesUsedToday: user.messagesUsedToday + 1 }
    })
  }
}

export {
  DAILY_LIKE_LIMIT,
  DAILY_MESSAGE_LIMIT,
  shouldResetLimit,
  getLikesRemaining,
  getMessagesRemaining,
  canLike,
  canMessage,
  incrementLikeCount,
  incrementMessageCount
}
