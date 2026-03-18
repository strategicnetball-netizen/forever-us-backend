import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedBoosts() {
  try {
    console.log('🚀 Seeding users with boosts...')

    // Create 5 test users with boosts
    const users = [
      {
        email: 'boosted1@test.com',
        name: 'Sarah Boosted',
        age: 26,
        gender: 'woman',
        location: 'Sydney, NSW',
        country: 'Australia',
        city: 'Sydney',
        state: 'NSW',
        bio: 'Adventure seeker and coffee lover ☕',
        tier: 'free',
        points: 100
      },
      {
        email: 'boosted2@test.com',
        name: 'Emma Premium',
        age: 28,
        gender: 'woman',
        location: 'Melbourne, VIC',
        country: 'Australia',
        city: 'Melbourne',
        state: 'VIC',
        bio: 'Yoga instructor and travel enthusiast 🧘',
        tier: 'premium',
        points: 200
      },
      {
        email: 'boosted3@test.com',
        name: 'Jessica VIP',
        age: 25,
        gender: 'woman',
        location: 'Brisbane, QLD',
        country: 'Australia',
        city: 'Brisbane',
        state: 'QLD',
        bio: 'Artist and dog lover 🎨🐕',
        tier: 'vip',
        points: 500
      },
      {
        email: 'boosted4@test.com',
        name: 'Amanda Boosted',
        age: 29,
        gender: 'woman',
        location: 'Perth, WA',
        country: 'Australia',
        city: 'Perth',
        state: 'WA',
        bio: 'Fitness enthusiast and foodie 💪',
        tier: 'free',
        points: 150
      },
      {
        email: 'boosted5@test.com',
        name: 'Rachel Premium',
        age: 27,
        gender: 'woman',
        location: 'Adelaide, SA',
        country: 'Australia',
        city: 'Adelaide',
        state: 'SA',
        bio: 'Book lover and wine enthusiast 📚🍷',
        tier: 'premium',
        points: 250
      }
    ]

    const hashedPassword = await bcrypt.hash('password123', 10)

    for (const userData of users) {
      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: {
          ...userData,
          password: hashedPassword,
          profileCompleted: true,
          isVerified: true
        }
      })

      console.log(`✓ Created user: ${user.name} (${user.email})`)

      // Create active boost (expires in 24 hours)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      const boost = await prisma.profileBoost.create({
        data: {
          userId: user.id,
          boostType: 'standard',
          coinsCost: user.tier === 'vip' ? 0 : (user.tier === 'premium' ? 30 : 50),
          expiresAt,
          isActive: true,
          lastBoostAt: new Date()
        }
      })

      console.log(`  🚀 Boost created: expires in 24 hours`)
    }

    console.log('\n✅ Boost seeding complete!')
    console.log('\nBoosted users:')
    console.log('- boosted1@test.com (Free tier, 50 coins)')
    console.log('- boosted2@test.com (Premium tier, 30 coins)')
    console.log('- boosted3@test.com (VIP tier, free)')
    console.log('- boosted4@test.com (Free tier, 50 coins)')
    console.log('- boosted5@test.com (Premium tier, 30 coins)')
    console.log('\nAll boosts expire in 24 hours')

  } catch (error) {
    console.error('❌ Error seeding boosts:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedBoosts()
