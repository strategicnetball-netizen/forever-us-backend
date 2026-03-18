import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUserLocation() {
  try {
    console.log('Fixing user location...')

    // Get the first user (Admin User)
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    })

    if (!user) {
      console.log('No user found')
      process.exit(1)
    }

    console.log(`Found user: ${user.name} (${user.email})`)
    console.log(`Current location: ${user.location || 'Not set'}`)
    console.log(`Current city: ${user.city || 'Not set'}`)
    console.log(`Current state: ${user.state || 'Not set'}`)
    console.log(`Current country: ${user.country || 'Not set'}`)

    // Update location fields
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { 
        location: 'Auckland, New Zealand',
        city: 'Auckland',
        state: 'Auckland',
        country: 'New Zealand'
      }
    })

    console.log(`✅ Updated location to: ${updated.location}`)
    console.log(`✅ Updated city to: ${updated.city}`)
    console.log(`✅ Updated state to: ${updated.state}`)
    console.log(`✅ Updated country to: ${updated.country}`)

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserLocation()
