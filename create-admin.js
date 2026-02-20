import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

dotenv.config()

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {
        password: hashedPassword,
        name: 'Admin User',
        points: 1000
      },
      create: {
        email: 'admin@admin.com',
        password: hashedPassword,
        name: 'Admin User',
        points: 1000,
        age: 30,
        gender: 'other',
        location: 'Admin City'
      }
    })

    console.log('✓ Admin user created/updated:')
    console.log(`  Email: ${admin.email}`)
    console.log(`  Password: admin123`)
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
