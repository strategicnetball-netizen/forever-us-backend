import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = 'admin@admin.com'
    const password = 'admin123'
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      console.log('✓ Admin already exists:', email)
      console.log('Password: admin123')
      return
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
        age: 30,
        gender: 'Other',
        location: 'Admin',
        bio: 'Administrator account',
        isAdmin: true,
        points: 10000,
        profileCompleted: true
      }
    })

    console.log('✓ Admin account created successfully!')
    console.log('Email:', email)
    console.log('Password: admin123')
    console.log('User ID:', admin.id)
  } catch (error) {
    console.error('Error creating admin:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
