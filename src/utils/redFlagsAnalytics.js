import { prisma } from '../index.js'

/**
 * Track a custom red flag or deal breaker
 * Increments frequency and topFourCount if applicable
 */
export async function trackCustomFlag(flagText, isTopFour = false, type = 'redFlag') {
  try {
    const listModel = type === 'redFlag' ? 'RedFlagsList' : 'DealBreakersList'
    const fieldName = type === 'redFlag' ? 'flag' : 'breaker'

    // Try to find existing flag
    let flag = await prisma[listModel].findUnique({
      where: { [fieldName]: flagText }
    })

    if (flag) {
      // Update existing flag
      await prisma[listModel].update({
        where: { [fieldName]: flagText },
        data: {
          frequency: { increment: 1 },
          topFourCount: isTopFour ? { increment: 1 } : undefined
        }
      })
    } else {
      // Create new flag
      await prisma[listModel].create({
        data: {
          [fieldName]: flagText,
          frequency: 1,
          topFourCount: isTopFour ? 1 : 0,
          isCustom: true,
          isActive: true
        }
      })
    }

    return true
  } catch (err) {
    console.error('Error tracking custom flag:', err)
    return false
  }
}

/**
 * Get analytics on red flags and deal breakers
 * Shows frequency and top 4 count for analysis
 */
export async function getFlagsAnalytics(type = 'redFlag', limit = 50) {
  try {
    const listModel = type === 'redFlag' ? 'RedFlagsList' : 'DealBreakersList'

    const flags = await prisma[listModel].findMany({
      where: { isActive: true },
      orderBy: [
        { topFourCount: 'desc' },
        { frequency: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        flag: type === 'redFlag' ? true : false,
        breaker: type === 'redFlag' ? false : true,
        frequency: true,
        topFourCount: true,
        isCustom: true,
        order: true,
        createdAt: true
      }
    })

    return flags
  } catch (err) {
    console.error('Error getting flags analytics:', err)
    return []
  }
}

/**
 * Get top N flags by frequency and top 4 count
 * Used to determine which flags should be in the main list
 */
export async function getTopFlags(type = 'redFlag', limit = 20) {
  try {
    const listModel = type === 'redFlag' ? 'RedFlagsList' : 'DealBreakersList'

    const flags = await prisma[listModel].findMany({
      where: { isActive: true },
      orderBy: [
        { topFourCount: 'desc' },
        { frequency: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        flag: type === 'redFlag' ? true : false,
        breaker: type === 'redFlag' ? false : true,
        frequency: true,
        topFourCount: true,
        order: true
      }
    })

    return flags
  } catch (err) {
    console.error('Error getting top flags:', err)
    return []
  }
}

/**
 * Update flag order (for admin to reorder the main list)
 */
export async function updateFlagOrder(flagId, newOrder, type = 'redFlag') {
  try {
    const listModel = type === 'redFlag' ? 'RedFlagsList' : 'DealBreakersList'

    await prisma[listModel].update({
      where: { id: flagId },
      data: { order: newOrder }
    })

    return true
  } catch (err) {
    console.error('Error updating flag order:', err)
    return false
  }
}

/**
 * Deactivate a flag (soft delete)
 */
export async function deactivateFlag(flagId, type = 'redFlag') {
  try {
    const listModel = type === 'redFlag' ? 'RedFlagsList' : 'DealBreakersList'

    await prisma[listModel].update({
      where: { id: flagId },
      data: { isActive: false }
    })

    return true
  } catch (err) {
    console.error('Error deactivating flag:', err)
    return false
  }
}
