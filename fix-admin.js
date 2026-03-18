import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAdmin() {
  try {
    const admin = await prisma.user.update({
      where: { email: 'admin@foreverus-dating.com' },
      data: { profileCompleted: true }
    })
    
    console.log('✓ Admin user updated!')
    console.log('Email:', admin.email)
    console.log('isAdmin:', admin.isAdmin)
    console.log('profileCompleted:', admin.profileCompleted)
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdmin()
