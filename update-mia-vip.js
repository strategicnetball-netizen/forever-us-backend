import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateMia() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'mia@test.com' }
    })
    
    if (!user) {
      console.log('Mia not found')
      return
    }

    console.log(`Found user: ${user.name} (${user.email}) - Current tier: ${user.tier}`)
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { tier: 'vip' }
    })

    console.log(`✓ Updated ${updated.name} to ${updated.tier} tier`)
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateMia()
