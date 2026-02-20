import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function upgradeUser() {
  try {
    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: 'user11@example.com' }
    })
    
    if (!user) {
      console.log('User not found')
      return
    }

    console.log(`Found user: ${user.name} (${user.email})`)
    
    // Update to premium
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { tier: 'premium' }
    })

    console.log(`✓ Upgraded ${updated.name} to ${updated.tier} tier`)
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

upgradeUser()
