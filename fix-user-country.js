import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUserCountry() {
  try {
    console.log('Fixing user country...')

    // Get the first user (Admin User)
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    })

    if (!user) {
      console.log('No user found')
      process.exit(1)
    }

    console.log(`Found user: ${user.name} (${user.email})`)
    console.log(`Current country: ${user.country || 'Not set'}`)

    // Update to New Zealand
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { country: 'New Zealand' }
    })

    console.log(`✅ Updated country to: ${updated.country}`)

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserCountry()
