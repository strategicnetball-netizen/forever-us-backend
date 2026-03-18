import { prisma } from '../index.js'

/**
 * Deletes all past events and their associated RSVPs
 * Should be called daily via a scheduled job
 */
export async function cleanupPastEvents() {
  try {
    const now = new Date()
    
    const result = await prisma.event.deleteMany({
      where: {
        eventDate: { lt: now }
      }
    })

    console.log(`[Event Cleanup] Deleted ${result.count} past events at ${now.toISOString()}`)
    return result.count
  } catch (err) {
    console.error('[Event Cleanup] Error:', err)
    throw err
  }
}

/**
 * Starts a daily cleanup job that runs at midnight UTC
 */
export function startDailyCleanup() {
  // Calculate milliseconds until next midnight UTC
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime()
  
  // Schedule first cleanup
  setTimeout(() => {
    cleanupPastEvents()
    
    // Then run every 24 hours
    setInterval(cleanupPastEvents, 24 * 60 * 60 * 1000)
  }, msUntilMidnight)
  
  console.log(`[Event Cleanup] Scheduled daily cleanup at midnight UTC (in ${Math.round(msUntilMidnight / 1000 / 60)} minutes)`)
}
