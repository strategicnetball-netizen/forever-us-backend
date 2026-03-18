import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
// Helper function to normalize answers for comparison
function normalizeAnswer(answer) {
    if (Array.isArray(answer)) {
        return answer.map(a => String(a).toLowerCase().trim()).sort().join('|');
    }
    return String(answer).toLowerCase().trim();
}
// Helper function to calculate similarity between two answers
function calculateSimilarity(answer1, answer2) {
    const norm1 = normalizeAnswer(answer1);
    const norm2 = normalizeAnswer(answer2);
    if (norm1 === norm2)
        return 100;
    if (norm1.includes(norm2) || norm2.includes(norm1))
        return 70;
    return 0;
}
// Helper function to check if profiles should be filtered based on red flags/deal breakers
async function shouldFilterProfile(currentUserId, candidateId) {
    try {
        // Get current user's red flags and deal breakers
        const currentUserRedFlags = await prisma.redFlagsQuestionnaire.findUnique({
            where: { userId: currentUserId },
            select: { selectedFlags: true }
        });
        const currentUserDealBreakers = await prisma.dealBreakersQuestionnaire.findUnique({
            where: { userId: currentUserId },
            select: { selectedBreakers: true }
        });
        // Get candidate's red flags and deal breakers
        const candidateRedFlags = await prisma.redFlagsQuestionnaire.findUnique({
            where: { userId: candidateId },
            select: { selectedFlags: true }
        });
        const candidateDealBreakers = await prisma.dealBreakersQuestionnaire.findUnique({
            where: { userId: candidateId },
            select: { selectedBreakers: true }
        });
        // Parse the JSON arrays
        const currentUserRedFlagsList = currentUserRedFlags ? JSON.parse(currentUserRedFlags.selectedFlags || '[]') : [];
        const currentUserDealBreakersList = currentUserDealBreakers ? JSON.parse(currentUserDealBreakers.selectedBreakers || '[]') : [];
        const candidateRedFlagsList = candidateRedFlags ? JSON.parse(candidateRedFlags.selectedFlags || '[]') : [];
        const candidateDealBreakersList = candidateDealBreakers ? JSON.parse(candidateDealBreakers.selectedBreakers || '[]') : [];
        // Check for deal breaker matches (any match = filter out)
        const dealBreakerMatch = currentUserDealBreakersList.some(db => candidateRedFlagsList.includes(db)) ||
            candidateDealBreakersList.some(db => currentUserRedFlagsList.includes(db));
        if (dealBreakerMatch) {
            return true; // Filter out this profile
        }
        // Check for red flag count (3+ = filter out)
        const redFlagMatches = currentUserRedFlagsList.filter(rf => candidateRedFlagsList.includes(rf)).length;
        if (redFlagMatches >= 3) {
            return true; // Filter out this profile
        }
        return false; // Don't filter
    }
    catch (err) {
        console.error('Error checking red flags/deal breakers:', err);
        return false; // On error, don't filter
    }
}
// Calculate questionnaire-based compatibility score
async function calculateQuestionnaireCompatibility(user1Id, user2Id) {
    try {
        const user1Q = await prisma.questionnaire.findUnique({
            where: { userId: user1Id }
        });
        const user2Q = await prisma.questionnaire.findUnique({
            where: { userId: user2Id }
        });
        if (!user1Q || !user2Q)
            return 0;
        let totalScore = 0;
        let questionsCompared = 0;
        // Compare key questions (kids, religion, politics, lifestyle, goals)
        const keyQuestions = [
            { q1: 'q1', q2: 'q1', weight: 1.5 }, // Kids
            { q1: 'q2', q2: 'q2', weight: 1.5 }, // Religion
            { q1: 'q3', q2: 'q3', weight: 1.2 }, // Politics
            { q1: 'q5', q2: 'q5', weight: 1.0 }, // Spontaneity
            { q1: 'q6', q2: 'q6', weight: 1.0 }, // Personality
            { q1: 'q10', q2: 'q10', weight: 1.0 }, // Fitness
            { q1: 'q14', q2: 'q14', weight: 1.0 } // Life motto
        ];
        for (const qPair of keyQuestions) {
            const ans1 = user1Q[qPair.q1];
            const ans2 = user2Q[qPair.q2];
            if (ans1 && ans2) {
                const similarity = calculateSimilarity(ans1, ans2);
                totalScore += similarity * qPair.weight;
                questionsCompared += qPair.weight;
            }
        }
        return questionsCompared > 0 ? Math.round(totalScore / questionsCompared) : 0;
    }
    catch (err) {
        console.error('Error calculating questionnaire compatibility:', err);
        return 0;
    }
}
// Calculate behavior-based preference score
async function calculateBehaviorScore(userId, candidateId) {
    try {
        // Get user's behavior patterns
        const userBehaviors = await prisma.userBehavior.findMany({
            where: { userId },
            select: { targetUserId: true, actionType: true }
        });
        // Analyze patterns
        const likedUsers = userBehaviors
            .filter(b => b.actionType === 'like')
            .map(b => b.targetUserId);
        const passedUsers = userBehaviors
            .filter(b => b.actionType === 'pass')
            .map(b => b.targetUserId);
        // Get candidate's profile
        const candidate = await prisma.user.findUnique({
            where: { id: candidateId },
            select: { age: true, gender: true, location: true }
        });
        if (!candidate)
            return 0;
        // Get average age/location of liked users
        const likedProfiles = await prisma.user.findMany({
            where: { id: { in: likedUsers } },
            select: { age: true, location: true }
        });
        let score = 0;
        // If user has liked similar profiles before, boost score
        if (likedProfiles.length > 0) {
            const avgAge = Math.round(likedProfiles.reduce((sum, p) => sum + (p.age || 0), 0) / likedProfiles.length);
            const ageDiff = Math.abs(candidate.age - avgAge);
            if (ageDiff <= 3)
                score += 15;
            else if (ageDiff <= 7)
                score += 10;
            else if (ageDiff <= 10)
                score += 5;
            // Location preference
            const locationMatches = likedProfiles.filter(p => p.location === candidate.location).length;
            if (locationMatches / likedProfiles.length > 0.5)
                score += 10;
        }
        // Penalize if similar to passed profiles
        if (passedUsers.length > 0) {
            const passedProfiles = await prisma.user.findMany({
                where: { id: { in: passedUsers } },
                select: { age: true, location: true }
            });
            const passedAvgAge = Math.round(passedProfiles.reduce((sum, p) => sum + (p.age || 0), 0) / passedProfiles.length);
            const ageDiff = Math.abs(candidate.age - passedAvgAge);
            if (ageDiff <= 2)
                score -= 10;
        }
        return Math.max(0, score);
    }
    catch (err) {
        console.error('Error calculating behavior score:', err);
        return 0;
    }
}
const router = express.Router();
// Get smart matching queue based on user behavior
router.get('/queue', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        // Get user's profile for filtering
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                age: true,
                gender: true,
                location: true,
                questionnaire: true,
                redFlagsQuestionnaire: true,
                dealBreakersQuestionnaire: true
            }
        });
        // Get users they've already interacted with
        const interactedUserIds = await prisma.userBehavior.findMany({
            where: { userId },
            select: { targetUserId: true }
        });
        const interactedIds = interactedUserIds.map(b => b.targetUserId);
        // Get blocked users
        const blockedUsers = await prisma.blockedUser.findMany({
            where: { blockerId: userId },
            select: { blockedId: true }
        });
        const blockedIds = blockedUsers.map(b => b.blockedId);
        // Get users who blocked this user
        const blockedByUsers = await prisma.blockedUser.findMany({
            where: { blockedId: userId },
            select: { blockerId: true }
        });
        const blockedByIds = blockedByUsers.map(b => b.blockerId);
        // Get matches to exclude
        const matches = await prisma.match.findMany({
            where: {
                OR: [
                    { userId },
                    { matchedUserId: userId }
                ]
            },
            select: {
                userId: true,
                matchedUserId: true
            }
        });
        const matchIds = matches.flatMap(m => [m.userId, m.matchedUserId]).filter(id => id !== userId);
        const excludeIds = new Set([userId, ...interactedIds, ...blockedIds, ...blockedByIds, ...matchIds]);
        // Check local pool size for small-market boost
        const localPoolCount = await prisma.user.count({
            where: {
                id: { notIn: Array.from(excludeIds) },
                location: user.location,
                age: user.age ? { gte: user.age - 10, lte: user.age + 10 } : undefined
            }
        });
        // Adaptive geographic expansion for small markets
        const MIN_POOL_THRESHOLD = 20;
        const EXPANSION_RADIUS_BOOST = 50; // km
        let ageRange = user.age ? { gte: user.age - 10, lte: user.age + 10 } : undefined;
        let locationFilter = user.location ? { equals: user.location } : undefined;
        // If local pool is small, loosen age filter and expand location search
        if (localPoolCount < MIN_POOL_THRESHOLD && user.location) {
            // Expand age range by 5 years on each side
            ageRange = user.age ? { gte: user.age - 15, lte: user.age + 15 } : undefined;
            // In a real implementation, this would use geographic distance
            // For now, we'll just get more candidates from any location
            locationFilter = undefined;
        }
        // Get candidates
        let candidates = await prisma.user.findMany({
            where: {
                id: { notIn: Array.from(excludeIds) },
                age: ageRange,
                location: locationFilter
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                age: true,
                gender: true,
                location: true,
                bio: true,
                photos: true,
                redFlagsQuestionnaire: true,
                dealBreakersQuestionnaire: true
            },
            take: limit * 2 // Get extra to score and sort
        });
        // If still not enough candidates, get from anywhere
        if (candidates.length < limit && localPoolCount < MIN_POOL_THRESHOLD) {
            candidates = await prisma.user.findMany({
                where: {
                    id: { notIn: Array.from(excludeIds) },
                    age: user.age ? { gte: user.age - 15, lte: user.age + 15 } : undefined
                },
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    age: true,
                    gender: true,
                    location: true,
                    bio: true,
                    photos: true,
                    redFlagsQuestionnaire: true,
                    dealBreakersQuestionnaire: true
                },
                take: limit * 2
            });
        }
        // Filter out candidates with red flags/deal breakers conflicts
        candidates = candidates.filter(candidate => {
            // Get user's red flags and deal breakers
            const userRedFlags = user.redFlagsQuestionnaire?.selectedFlags
                ? JSON.parse(user.redFlagsQuestionnaire.selectedFlags)
                : [];
            const userDealBreakers = user.dealBreakersQuestionnaire?.selectedBreakers
                ? JSON.parse(user.dealBreakersQuestionnaire.selectedBreakers)
                : [];
            // Get candidate's red flags and deal breakers
            const candidateRedFlags = candidate.redFlagsQuestionnaire?.selectedFlags
                ? JSON.parse(candidate.redFlagsQuestionnaire.selectedFlags)
                : [];
            const candidateDealBreakers = candidate.dealBreakersQuestionnaire?.selectedBreakers
                ? JSON.parse(candidate.dealBreakersQuestionnaire.selectedBreakers)
                : [];
            // Check for deal breaker matches (any match = filter out)
            const userDealBreakerMatch = userDealBreakers.some(db => candidateRedFlags.includes(db));
            const candidateDealBreakerMatch = candidateDealBreakers.some(db => userRedFlags.includes(db));
            if (userDealBreakerMatch || candidateDealBreakerMatch) {
                return false;
            }
            // Check for red flag count (3+ = filter out)
            const redFlagMatches = userRedFlags.filter(rf => candidateRedFlags.includes(rf)).length;
            if (redFlagMatches >= 3) {
                return false;
            }
            return true;
        });
        // Score candidates based on behavior patterns
        const scoredCandidates = candidates.map(candidate => {
            let score = 50; // Base score
            // Gender preference (if user has indicated preference)
            if (user.gender && candidate.gender) {
                score += 10;
            }
            // Location match (boost for same location, especially in small markets)
            if (user.location && candidate.location && user.location === candidate.location) {
                score += 20;
            }
            else if (localPoolCount < MIN_POOL_THRESHOLD && candidate.location) {
                // Small market boost: give slight boost to nearby locations
                score += 5;
            }
            // Age proximity
            if (user.age && candidate.age) {
                const ageDiff = Math.abs(user.age - candidate.age);
                if (ageDiff <= 5)
                    score += 15;
                else if (ageDiff <= 10)
                    score += 10;
                else if (ageDiff <= 15)
                    score += 5; // Small market boost for expanded age range
            }
            // Has photos
            if (candidate.photos) {
                try {
                    const photos = JSON.parse(candidate.photos);
                    score += Math.min(photos.length * 5, 15);
                }
                catch (e) {
                    // ignore
                }
            }
            return { ...candidate, score };
        });
        // Sort by score descending
        scoredCandidates.sort((a, b) => b.score - a.score);
        // Return top candidates
        const queue = scoredCandidates.slice(0, limit);
        res.json(queue);
    }
    catch (err) {
        console.error('Error getting smart queue:', err);
        res.status(500).json({ error: 'Failed to get queue' });
    }
});
// Track user behavior (like, pass, view, message)
router.post('/track-behavior', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetUserId, actionType } = req.body;
        if (!targetUserId || !actionType) {
            return res.status(400).json({ error: 'targetUserId and actionType are required' });
        }
        // Valid action types
        const validActions = ['like', 'pass', 'message', 'view'];
        if (!validActions.includes(actionType)) {
            return res.status(400).json({ error: 'Invalid actionType' });
        }
        // Record behavior
        await prisma.userBehavior.create({
            data: {
                userId,
                targetUserId,
                actionType
            }
        });
        res.json({ success: true });
    }
    catch (err) {
        console.error('Error tracking behavior:', err);
        res.status(500).json({ error: 'Failed to track behavior' });
    }
});
// Get behavior analytics for a user
router.get('/analytics', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const behaviors = await prisma.userBehavior.findMany({
            where: { userId },
            select: { actionType: true }
        });
        const analytics = {
            likes: behaviors.filter(b => b.actionType === 'like').length,
            passes: behaviors.filter(b => b.actionType === 'pass').length,
            messages: behaviors.filter(b => b.actionType === 'message').length,
            views: behaviors.filter(b => b.actionType === 'view').length,
            total: behaviors.length
        };
        res.json(analytics);
    }
    catch (err) {
        console.error('Error getting analytics:', err);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});
export default router;
