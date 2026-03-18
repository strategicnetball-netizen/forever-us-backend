// Utility functions for managing daily limits
const DAILY_LIKE_LIMIT_FREE = 5;
const DAILY_LIKE_LIMIT_PREMIUM = 7;
const DAILY_PASS_LIMIT = 7;
const DAILY_MESSAGE_LIMIT_FREE = 5;
const DAILY_MESSAGE_LIMIT_PREMIUM = 7;
const DAILY_AD_LIMIT = 10;
const MAX_PAYABLE_LIKES_FREE = 7;
const MAX_PAYABLE_MESSAGES_FREE = 10;
/**
 * Check if daily limit needs to be reset (new day)
 */
function shouldResetLimit(lastResetDate) {
    if (!lastResetDate)
        return true;
    const lastReset = new Date(lastResetDate);
    const now = new Date();
    // Reset if different day (UTC)
    return lastReset.toDateString() !== now.toDateString();
}
/**
 * Get remaining likes for user
 * Free: 5 free likes/day, then pay 2 coins per like (max 7 payable = 12 total)
 * Premium: 7 free likes/day, then pay 1 coin per like
 * VIP: Unlimited free likes
 */
async function getLikesRemaining(user) {
    if (user.tier === 'vip') {
        return { remaining: Infinity, limit: Infinity, tier: 'vip' };
    }
    if (user.tier === 'free') {
        // Free users: 5 free likes per day, then max 7 payable likes
        if (shouldResetLimit(user.lastLikeResetDate)) {
            return { remaining: DAILY_LIKE_LIMIT_FREE, limit: DAILY_LIKE_LIMIT_FREE + MAX_PAYABLE_LIKES_FREE, tier: 'free', costAfterLimit: 2 };
        }
        const maxTotalLikes = DAILY_LIKE_LIMIT_FREE + MAX_PAYABLE_LIKES_FREE;
        const remaining = Math.max(0, maxTotalLikes - user.likesUsedToday);
        return { remaining, limit: maxTotalLikes, tier: 'free', costAfterLimit: 2 };
    }
    // Premium users: 7 free likes per day
    if (shouldResetLimit(user.lastLikeResetDate)) {
        return { remaining: DAILY_LIKE_LIMIT_PREMIUM, limit: DAILY_LIKE_LIMIT_PREMIUM, tier: 'premium', costAfterLimit: 1 };
    }
    const remaining = Math.max(0, DAILY_LIKE_LIMIT_PREMIUM - user.likesUsedToday);
    return { remaining, limit: DAILY_LIKE_LIMIT_PREMIUM, tier: 'premium', costAfterLimit: 1 };
}
/**
 * Get remaining passes for user
 */
async function getPassesRemaining(user) {
    if (user.tier === 'premium' || user.tier === 'vip') {
        return { remaining: Infinity, limit: Infinity, isPremium: true };
    }
    if (shouldResetLimit(user.lastPassResetDate)) {
        return { remaining: DAILY_PASS_LIMIT, limit: DAILY_PASS_LIMIT, isPremium: false };
    }
    const remaining = Math.max(0, DAILY_PASS_LIMIT - user.passesUsedToday);
    return { remaining, limit: DAILY_PASS_LIMIT, isPremium: false };
}
/**
 * Get remaining messages for user
 * Free: 5 free messages/day, then pay 5 coins per message (max 10 payable = 15 total)
 * Premium: 7 free messages/day, then pay 3 coins per message
 * VIP: Unlimited free messages
 */
async function getMessagesRemaining(user) {
    if (user.tier === 'vip') {
        return { remaining: Infinity, limit: Infinity, tier: 'vip' };
    }
    if (user.tier === 'free') {
        // Free users: 5 free messages per day, then max 10 payable messages
        if (shouldResetLimit(user.lastMessageResetDate)) {
            return { remaining: DAILY_MESSAGE_LIMIT_FREE, limit: DAILY_MESSAGE_LIMIT_FREE + MAX_PAYABLE_MESSAGES_FREE, tier: 'free', costAfterLimit: 5 };
        }
        const maxTotalMessages = DAILY_MESSAGE_LIMIT_FREE + MAX_PAYABLE_MESSAGES_FREE;
        const remaining = Math.max(0, maxTotalMessages - user.messagesUsedToday);
        return { remaining, limit: maxTotalMessages, tier: 'free', costAfterLimit: 5 };
    }
    // Premium users: 7 free messages per day
    if (shouldResetLimit(user.lastMessageResetDate)) {
        return { remaining: DAILY_MESSAGE_LIMIT_PREMIUM, limit: DAILY_MESSAGE_LIMIT_PREMIUM, tier: 'premium', costAfterLimit: 3 };
    }
    const remaining = Math.max(0, DAILY_MESSAGE_LIMIT_PREMIUM - user.messagesUsedToday);
    return { remaining, limit: DAILY_MESSAGE_LIMIT_PREMIUM, tier: 'premium', costAfterLimit: 3 };
}
/**
 * Check if user can like (and reset if needed)
 * Free: 5 free likes/day, then costs 2 coins per like (max 7 payable likes)
 * Premium: 7 free likes/day, then costs 1 coin per like
 * VIP: Always can like (free)
 */
async function canLike(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true, likesUsedToday: true, lastLikeResetDate: true }
    });
    if (!user)
        return { canLike: false, error: 'User not found' };
    // VIP users can always like for free
    if (user.tier === 'vip') {
        return { canLike: true, remaining: Infinity, tier: 'vip', costPerLike: 0 };
    }
    // Free users: 5 free likes per day, then max 7 payable likes
    if (user.tier === 'free') {
        if (shouldResetLimit(user.lastLikeResetDate)) {
            // Reset the counter
            await prisma.user.update({
                where: { id: userId },
                data: {
                    likesUsedToday: 0,
                    lastLikeResetDate: new Date()
                }
            });
            return { canLike: true, remaining: DAILY_LIKE_LIMIT_FREE, tier: 'free', costPerLike: 0 };
        }
        // Check if free user has free likes remaining
        if (user.likesUsedToday < DAILY_LIKE_LIMIT_FREE) {
            return { canLike: true, remaining: DAILY_LIKE_LIMIT_FREE - user.likesUsedToday, tier: 'free', costPerLike: 0 };
        }
        // Check if free user has reached max payable likes (5 free + 7 payable = 12 total)
        const maxTotalLikes = DAILY_LIKE_LIMIT_FREE + MAX_PAYABLE_LIKES_FREE;
        if (user.likesUsedToday >= maxTotalLikes) {
            return { canLike: false, error: 'Daily like limit reached', remaining: 0, tier: 'free', costPerLike: 2 };
        }
        // Free user exceeded free limit, now costs 2 coins per like (but limited to 7 payable)
        const payableLikesUsed = user.likesUsedToday - DAILY_LIKE_LIMIT_FREE;
        const payableLikesRemaining = MAX_PAYABLE_LIKES_FREE - payableLikesUsed;
        return { canLike: true, remaining: payableLikesRemaining, tier: 'free', costPerLike: 2 };
    }
    // Premium users: 7 free likes per day
    if (shouldResetLimit(user.lastLikeResetDate)) {
        // Reset the counter
        await prisma.user.update({
            where: { id: userId },
            data: {
                likesUsedToday: 0,
                lastLikeResetDate: new Date()
            }
        });
        return { canLike: true, remaining: DAILY_LIKE_LIMIT_PREMIUM, tier: 'premium', costPerLike: 0 };
    }
    // Check if premium user has free likes remaining
    if (user.likesUsedToday < DAILY_LIKE_LIMIT_PREMIUM) {
        return { canLike: true, remaining: DAILY_LIKE_LIMIT_PREMIUM - user.likesUsedToday, tier: 'premium', costPerLike: 0 };
    }
    // Premium user exceeded free limit, now costs 1 coin per like
    return { canLike: true, remaining: Infinity, tier: 'premium', costPerLike: 1 };
}
/**
 * Check if user can pass (and reset if needed)
 */
async function canPass(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true, passesUsedToday: true, lastPassResetDate: true }
    });
    if (!user)
        return { canPass: false, error: 'User not found' };
    // Premium and VIP users can always pass
    if (user.tier === 'premium' || user.tier === 'vip') {
        return { canPass: true, remaining: Infinity };
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
        });
        return { canPass: true, remaining: DAILY_PASS_LIMIT };
    }
    // Check if limit reached
    if (user.passesUsedToday >= DAILY_PASS_LIMIT) {
        return {
            canPass: false,
            error: 'Daily pass limit reached',
            remaining: 0,
            limit: DAILY_PASS_LIMIT
        };
    }
    return { canPass: true, remaining: DAILY_PASS_LIMIT - user.passesUsedToday };
}
/**
 * Check if user can message (and reset if needed)
 * Free: 5 free messages/day, then costs 5 coins per message (max 10 payable messages)
 * Premium: 7 free messages/day, then costs 3 coins per message
 * VIP: Always can message (free)
 */
async function canMessage(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true, messagesUsedToday: true, lastMessageResetDate: true }
    });
    if (!user)
        return { canMessage: false, error: 'User not found' };
    // VIP users can always message for free
    if (user.tier === 'vip') {
        return { canMessage: true, remaining: Infinity, tier: 'vip', costPerMessage: 0 };
    }
    // Free users: 5 free messages per day, then max 10 payable messages
    if (user.tier === 'free') {
        if (shouldResetLimit(user.lastMessageResetDate)) {
            // Reset the counter
            await prisma.user.update({
                where: { id: userId },
                data: {
                    messagesUsedToday: 0,
                    lastMessageResetDate: new Date()
                }
            });
            return { canMessage: true, remaining: DAILY_MESSAGE_LIMIT_FREE, tier: 'free', costPerMessage: 0 };
        }
        // Check if free user has free messages remaining
        if (user.messagesUsedToday < DAILY_MESSAGE_LIMIT_FREE) {
            return { canMessage: true, remaining: DAILY_MESSAGE_LIMIT_FREE - user.messagesUsedToday, tier: 'free', costPerMessage: 0 };
        }
        // Check if free user has reached max payable messages (5 free + 10 payable = 15 total)
        const maxTotalMessages = DAILY_MESSAGE_LIMIT_FREE + MAX_PAYABLE_MESSAGES_FREE;
        if (user.messagesUsedToday >= maxTotalMessages) {
            return { canMessage: false, error: 'Daily message limit reached', remaining: 0, tier: 'free', costPerMessage: 5 };
        }
        // Free user exceeded free limit, now costs 5 coins per message (but limited to 10 payable)
        const payableMessagesUsed = user.messagesUsedToday - DAILY_MESSAGE_LIMIT_FREE;
        const payableMessagesRemaining = MAX_PAYABLE_MESSAGES_FREE - payableMessagesUsed;
        return { canMessage: true, remaining: payableMessagesRemaining, tier: 'free', costPerMessage: 5 };
    }
    // Premium users: 7 free messages per day
    if (shouldResetLimit(user.lastMessageResetDate)) {
        // Reset the counter
        await prisma.user.update({
            where: { id: userId },
            data: {
                messagesUsedToday: 0,
                lastMessageResetDate: new Date()
            }
        });
        return { canMessage: true, remaining: DAILY_MESSAGE_LIMIT_PREMIUM, tier: 'premium', costPerMessage: 0 };
    }
    // Check if premium user has free messages remaining
    if (user.messagesUsedToday < DAILY_MESSAGE_LIMIT_PREMIUM) {
        return { canMessage: true, remaining: DAILY_MESSAGE_LIMIT_PREMIUM - user.messagesUsedToday, tier: 'premium', costPerMessage: 0 };
    }
    // Premium user exceeded free limit, now costs 3 coins per message
    return { canMessage: true, remaining: Infinity, tier: 'premium', costPerMessage: 3 };
}
/**
 * Increment like counter
 */
async function incrementLikeCount(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { likesUsedToday: true, lastLikeResetDate: true }
    });
    // Reset if new day
    if (shouldResetLimit(user.lastLikeResetDate)) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                likesUsedToday: 1,
                lastLikeResetDate: new Date()
            }
        });
    }
    else {
        await prisma.user.update({
            where: { id: userId },
            data: { likesUsedToday: user.likesUsedToday + 1 }
        });
    }
}
/**
 * Increment message counter
 */
async function incrementMessageCount(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { messagesUsedToday: true, lastMessageResetDate: true }
    });
    // Reset if new day
    if (shouldResetLimit(user.lastMessageResetDate)) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                messagesUsedToday: 1,
                lastMessageResetDate: new Date()
            }
        });
    }
    else {
        await prisma.user.update({
            where: { id: userId },
            data: { messagesUsedToday: user.messagesUsedToday + 1 }
        });
    }
}
/**
 * Increment pass counter
 */
async function incrementPassCount(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passesUsedToday: true, lastPassResetDate: true }
    });
    // Reset if new day
    if (shouldResetLimit(user.lastPassResetDate)) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                passesUsedToday: 1,
                lastPassResetDate: new Date()
            }
        });
    }
    else {
        await prisma.user.update({
            where: { id: userId },
            data: { passesUsedToday: user.passesUsedToday + 1 }
        });
    }
}
/**
 * Check if user can watch an ad (and reset if needed)
 */
async function canWatchAd(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true, adCompletionsToday: true, adCompletionsResetDate: true }
    });
    if (!user)
        return { canWatchAd: false, error: 'User not found' };
    // Premium and VIP users can watch unlimited ads
    if (user.tier === 'premium' || user.tier === 'vip') {
        return { canWatchAd: true, remaining: Infinity };
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
        });
        return { canWatchAd: true, remaining: DAILY_AD_LIMIT };
    }
    // Check if limit reached
    if (user.adCompletionsToday >= DAILY_AD_LIMIT) {
        return {
            canWatchAd: false,
            error: 'Daily ad limit reached',
            remaining: 0,
            limit: DAILY_AD_LIMIT
        };
    }
    return { canWatchAd: true, remaining: DAILY_AD_LIMIT - user.adCompletionsToday };
}
/**
 * Increment ad completion counter
 */
async function incrementAdCount(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { adCompletionsToday: true, adCompletionsResetDate: true }
    });
    // Reset if new day
    if (shouldResetLimit(user.adCompletionsResetDate)) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                adCompletionsToday: 1,
                adCompletionsResetDate: new Date()
            }
        });
    }
    else {
        await prisma.user.update({
            where: { id: userId },
            data: { adCompletionsToday: user.adCompletionsToday + 1 }
        });
    }
}
export { DAILY_LIKE_LIMIT_FREE, DAILY_LIKE_LIMIT_PREMIUM, DAILY_PASS_LIMIT, DAILY_MESSAGE_LIMIT_FREE, DAILY_MESSAGE_LIMIT_PREMIUM, DAILY_AD_LIMIT, MAX_PAYABLE_LIKES_FREE, MAX_PAYABLE_MESSAGES_FREE, shouldResetLimit, getLikesRemaining, getPassesRemaining, getMessagesRemaining, canLike, canPass, canMessage, canWatchAd, incrementLikeCount, incrementPassCount, incrementMessageCount, incrementAdCount };
