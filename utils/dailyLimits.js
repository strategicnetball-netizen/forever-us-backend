// Utility functions for managing daily limits

const DAILY_LIKE_LIMIT = 7
const DAILY_PASS_LIMIT = 7
const DAILY_MESSAGE_LIMIT = 10
const DAILY_AD_LIMIT = 10

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
  if (user.tier === 'premium' || user.tier === 'vip') {
    return { remaining: Infinity, limit: Infinity, isPremium: true }
  }
  
  if (shouldResetLimit(user.lastLikeResetDate)) {
    return { remaining: DAILY_LIKE_LIMIT, limit: DAILY_LIKE_LIMIT, isPremium: false }
  }
  
  const remaining = Math.max(0, DAILY_LIKE_LIMIT - user.likesUsedToday)
  return { remaining, limit: DAILY_LIKE_LIMIT, isPremium: false }
}

/**
 * Get remaining passes for user
 */
async function getPassesRemaining(user) {
  if (user.tier === 'premium' || user.tier === 'vip') {
    return { remaining: Infinity, limit: Infinity, isPremium: true }
  }
  
  if (shouldResetLimit(user.lastPassResetDate)) {
    return { remaining: DAILY_PASS_LIMIT, limit: DAILY_PASS_LIMIT, isPremium: false }
  }
  
  const remaining = Math.max(0, DAILY_PASS_LIMIT - user.passesUsedToday)
  return { remaining, limit: DAILY_PASS_LIMIT, isPremium: false }
}

/**
 * Get remaining messages for user
 */
async function getMessagesRemaining(user) {
  if (user.tier === 'premium' || user.tier === 'vip') {
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
  
  // Premium and VIP users can always like
  if (user.tier === 'premium' || user.tier === 'vip') {
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
 * Check if user can pass (and reset if needed)
 */
async function canPass(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, passesUsedToday: true, lastPassResetDate: true }
  })
  
  if (!user) return { canPass: false, error: 'User not found' }
  
  // Premium and VIP users can always pass
  if (user.tier === 'premium' || user.tier === 'vip') {
    return { canPass: true, remaining: Infinity }
  }
  
  // Check if we need to reset
  if (shouldResetLimit(user.lastPassResetDate)) {
    // Reset the counter
    await prisma.user.update({
      where: { id: userId },
      data: {
        passesUsedToday: 0,
        lastPassResetDate: new Date()
      }
    })
    return { canPass: true, remaining: DAILY_PASS_LIMIT }
  }
  
  // Check if limit reached
  if (user.passesUsedToday >= DAILY_PASS_LIMIT) {
    return { 
      canPass: false, 
      error: 'Daily pass limit reached',
      remaining: 0,
      limit: DAILY_PASS_LIMIT
    }
  }
  
  return { canPass: true, remaining: DAILY_PASS_LIMIT - user.passesUsedToday }
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
  
  // Premium and VIP users can always message
  if (user.tier === 'premium' || user.tier === 'vip') {
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

/**
 * Increment pass counter
 */
async function incrementPassCount(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passesUsedToday: true, lastPassResetDate: true }
  })
  
  // Reset if new day
  if (shouldResetLimit(user.lastPassResetDate)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passesUsedToday: 1,
        lastPassResetDate: new Date()
      }
    })
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { passesUsedToday: user.passesUsedToday + 1 }
    })
  }
}

/**
 * Check if user can watch an ad (and reset if needed)
 */
async function canWatchAd(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, adCompletionsToday: true, adCompletionsResetDate: true }
  })
  
  if (!user) return { canWatchAd: false, error: 'User not found' }
  
  // Premium and VIP users can watch unlimited ads
  if (user.tier === 'premium' || user.tier === 'vip') {
    return { canWatchAd: true, remaining: Infinity }
  }
  
  // Check if we need to reset
  if (shouldResetLimit(user.adCompletionsResetDate)) {
    // Reset the counter
    await prisma.user.update({
      where: { id: userId },
      data: {
        adCompletionsToday: 0,
        adCompletionsResetDate: new Date()
      }
    })
    return { canWatchAd: true, remaining: DAILY_AD_LIMIT }
  }
  
  // Check if limit reached
  if (user.adCompletionsToday >= DAILY_AD_LIMIT) {
    return { 
      canWatchAd: false, 
      error: 'Daily ad limit reached',
      remaining: 0,
      limit: DAILY_AD_LIMIT
    }
  }
  
  return { canWatchAd: true, remaining: DAILY_AD_LIMIT - user.adCompletionsToday }
}

/**
 * Increment ad completion counter
 */
async function incrementAdCount(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { adCompletionsToday: true, adCompletionsResetDate: true }
  })
  
  // Reset if new day
  if (shouldResetLimit(user.adCompletionsResetDate)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        adCompletionsToday: 1,
        adCompletionsResetDate: new Date()
      }
    })
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { adCompletionsToday: user.adCompletionsToday + 1 }
    })
  }
}

export {
  DAILY_LIKE_LIMIT,
  DAILY_PASS_LIMIT,
  DAILY_MESSAGE_LIMIT,
  DAILY_AD_LIMIT,
  shouldResetLimit,
  getLikesRemaining,
  getPassesRemaining,
  getMessagesRemaining,
  canLike,
  canPass,
  canMessage,
  canWatchAd,
  incrementLikeCount,
  incrementPassCount,
  incrementMessageCount,
  incrementAdCount
}

