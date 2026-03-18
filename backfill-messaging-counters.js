import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfillMessagingCounters() {
  try {
    console.log('Starting to backfill messaging counters...')

    // Get all messages
    const messages = await prisma.message.findMany()
    console.log(`Found ${messages.length} messages`)

    // Create a map to count messages per user
    const sentCounts = {}
    const receivedCounts = {}

    messages.forEach(msg => {
      // Count sent messages
      if (!sentCounts[msg.senderId]) {
        sentCounts[msg.senderId] = 0
      }
      sentCounts[msg.senderId]++

      // Count received messages
      if (!receivedCounts[msg.receiverId]) {
        receivedCounts[msg.receiverId] = 0
      }
      receivedCounts[msg.receiverId]++
    })

    console.log(`Unique senders: ${Object.keys(sentCounts).length}`)
    console.log(`Unique receivers: ${Object.keys(receivedCounts).length}`)

    // Update all users with their counts
    const allUserIds = new Set([...Object.keys(sentCounts), ...Object.keys(receivedCounts)])
    console.log(`Updating ${allUserIds.size} users...`)

    for (const userId of allUserIds) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          messagesSent: sentCounts[userId] || 0,
          messagesReceived: receivedCounts[userId] || 0
        }
      })
    }

    console.log('✓ Backfill complete!')
    console.log(`Total messages sent: ${Object.values(sentCounts).reduce((a, b) => a + b, 0)}`)
    console.log(`Total messages received: ${Object.values(receivedCounts).reduce((a, b) => a + b, 0)}`)
  } catch (err) {
    console.error('Error backfilling:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

backfillMessagingCounters()
