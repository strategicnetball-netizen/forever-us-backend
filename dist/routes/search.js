import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
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
// Search with filters
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { minAge, maxAge, gender, location, distance } = req.body;
        // Get list of users already liked by current user
        const likedUsers = await prisma.like.findMany({
            where: { likerId: req.userId },
            select: { likedId: true }
        });
        const likedIds = likedUsers.map(like => like.likedId);
        const where = {
            id: {
                not: req.userId,
                notIn: likedIds
            }
        };
        if (minAge || maxAge) {
            where.age = {};
            if (minAge)
                where.age.gte = minAge;
            if (maxAge)
                where.age.lte = maxAge;
        }
        if (gender) {
            where.gender = gender;
        }
        if (location) {
            where.location = {
                contains: location,
                mode: 'insensitive'
            };
        }
        let users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                bio: true,
                avatar: true,
                age: true,
                gender: true,
                location: true
            },
            take: 100 // Get more to account for filtering
        });
        // Filter out profiles based on red flags and deal breakers
        const filteredUsers = [];
        for (const user of users) {
            const shouldFilter = await shouldFilterProfile(req.userId, user.id);
            if (!shouldFilter) {
                filteredUsers.push(user);
            }
        }
        res.json(filteredUsers.slice(0, 50));
    }
    catch (err) {
        next(err);
    }
});
export default router;
