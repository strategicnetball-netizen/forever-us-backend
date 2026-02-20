import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing messages
  await prisma.tickerMessage.deleteMany({})

  const messages = [
    { text: '💕 New matches available! Check your Matches page', action: '/matches', order: 1 },
    { text: '📺 Watch ads and earn 10 points each', action: '/ads', order: 2 },
    { text: '📋 Complete surveys for 15 points', action: '/surveys', order: 3 },
    { text: '🎁 Daily sign-in bonus available on the Earn page', action: '/ads', order: 4 },
    { text: '💬 Send messages to your matches and admirers', action: '/messages', order: 5 },
    { text: '🔍 Use Search to find your perfect match', action: '/search', order: 6 },
    { text: '⭐ Complete your profile for better matches', action: '/profile', order: 7 },
    { text: '🎯 AI Picks: 2 free profiles every day', action: '/dashboard', order: 8 },
    { text: '🎉 Earn 500 points for a 1-month trial upgrade!', action: '/shop', order: 9 },
  ]

  for (const msg of messages) {
    await prisma.tickerMessage.create({
      data: msg
    })
  }

  console.log('✅ Ticker messages seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
