import { prisma } from '../index.js';
/**
 * Process custom red flag/deal breaker
 * - Add to list if new
 * - Increment frequency if exists
 * - Manage top 20 list (drop lowest frequency if needed)
 */
export async function processCustomFlag(flagText, type = 'redFlag') {
    if (!flagText || flagText.trim().length === 0)
        return null;
    const normalizedFlag = flagText.trim().toLowerCase();
    const listModel = type === 'redFlag' ? 'RedFlagsList' : 'DealBreakersList';
    try {
        // Check if flag already exists
        let flag = await prisma[listModel].findUnique({
            where: { flag: normalizedFlag }
        });
        if (flag) {
            // Increment frequency
            flag = await prisma[listModel].update({
                where: { flag: normalizedFlag },
                data: { frequency: { increment: 1 } }
            });
        }
        else {
            // Create new flag
            flag = await prisma[listModel].create({
                data: {
                    flag: normalizedFlag,
                    frequency: 1,
                    isCustom: true,
                    isActive: false // Start inactive, will be promoted if popular
                }
            });
        }
        // Check if we need to update the top 20
        await updateTop20List(type);
        return flag;
    }
    catch (err) {
        console.error(`Error processing custom ${type}:`, err);
        return null;
    }
}
/**
 * Maintain top 20 active flags
 * - Keep 20 most frequent flags active
 * - Deactivate lower frequency flags
 * - Promote high-frequency custom flags
 */
export async function updateTop20List(type = 'redFlag') {
    const listModel = type === 'redFlag' ? 'RedFlagsList' : 'DealBreakersList';
    try {
        // Get all flags sorted by frequency (descending)
        const allFlags = await prisma[listModel].findMany({
            orderBy: { frequency: 'desc' }
        });
        // Top 20 should be active
        const top20 = allFlags.slice(0, 20);
        const rest = allFlags.slice(20);
        // Activate top 20
        for (let i = 0; i < top20.length; i++) {
            await prisma[listModel].update({
                where: { id: top20[i].id },
                data: {
                    isActive: true,
                    order: i + 1 // Set display order
                }
            });
        }
        // Deactivate the rest
        for (const flag of rest) {
            await prisma[listModel].update({
                where: { id: flag.id },
                data: { isActive: false }
            });
        }
        console.log(`Updated top 20 ${type}s. Active count: ${top20.length}`);
    }
    catch (err) {
        console.error(`Error updating top 20 ${type}s:`, err);
    }
}
/**
 * Get active flags for display (top 20)
 */
export async function getActiveFlags(type = 'redFlag') {
    const listModel = type === 'redFlag' ? 'RedFlagsList' : 'DealBreakersList';
    try {
        const flags = await prisma[listModel].findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                flag: true,
                frequency: true,
                isCustom: true
            }
        });
        return flags;
    }
    catch (err) {
        console.error(`Error fetching active ${type}s:`, err);
        return [];
    }
}
/**
 * Get frequency stats for admin dashboard
 */
export async function getFlagStats(type = 'redFlag', limit = 50) {
    const listModel = type === 'redFlag' ? 'RedFlagsList' : 'DealBreakersList';
    try {
        const stats = await prisma[listModel].findMany({
            orderBy: { frequency: 'desc' },
            take: limit,
            select: {
                flag: true,
                frequency: true,
                isActive: true,
                isCustom: true,
                order: true
            }
        });
        return stats;
    }
    catch (err) {
        console.error(`Error fetching ${type} stats:`, err);
        return [];
    }
}
