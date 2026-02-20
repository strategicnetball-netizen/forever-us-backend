import { PrismaClient } from '@prisma/client'
import { POINTS_CONFIG } from './src/utils/constants.js'

const prisma = new PrismaClient()

async function updateUserPoints() {
  try {
    console.log('Updating user points...\n')

    // Update all users with 0 points to have the starting bonus
    const result = await prisma.user.updateMany({
      where: { points: 0 },
      data: { points: POINTS_CONFIG.STARTING_BONUS }
    })

    console.log(`✓ Updated ${result.count} users with ${POINTS_CONFIG.STARTING_BONUS} starting points`)

    // Show updated users
    const users = await prisma.user.findMany({
      where: { points: POINTS_CONFIG.STARTING_BONUS },
      select: { id: true, email: true, name: true, points: true }
    })

    console.log('\nUpdated users:')
    users.forEach(u => {
      console.log(`  ${u.email}: ${u.points} points`)
    })

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

updateUserPoints()
