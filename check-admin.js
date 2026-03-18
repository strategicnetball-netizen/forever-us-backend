import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@foreverus-dating.com' }
    })
    
    console.log('Admin user:')
    console.log('Email:', admin?.email)
    console.log('isAdmin:', admin?.isAdmin)
    console.log('profileCompleted:', admin?.profileCompleted)
    console.log('Full user:', JSON.stringify(admin, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
