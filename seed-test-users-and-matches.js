import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const firstNames = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor', 'Avery', 'Quinn', 'Sage', 'River']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
const cities = {
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga'],
  Vietnam: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong']
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomAge() {
  return Math.floor(Math.random() * (45 - 22 + 1)) + 22
}

function getRandomGender() {
  return getRandomItem(['man', 'woman', 'bisexual', 'gay', 'lesbian'])
}

async function seedTestUsers() {
  try {
    console.log('🌱 Starting to seed test users and matches...')

    // Get the first user (your account)
    const currentUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    })

    if (!currentUser) {
      console.error('❌ No existing user found. Please create an account first.')
      process.exit(1)
    }

    console.log(`✅ Found current user: ${currentUser.name} (${currentUser.id})`)

    const countries = ['Australia', 'New Zealand', 'Vietnam']
    let totalUsersCreated = 0
    let totalMatchesCreated = 0

    for (const country of countries) {
      console.log(`\n📍 Creating 10 users in ${country}...`)

      for (let i = 0; i < 10; i++) {
        const firstName = getRandomItem(firstNames)
        const lastName = getRandomItem(lastNames)
        const email = `test-${country.toLowerCase()}-${i + 1}-${Date.now()}@test.com`
        const hashedPassword = await bcrypt.hash('password123', 10)

        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: `${firstName} ${lastName}`,
            age: getRandomAge(),
            gender: getRandomGender(),
            country,
            location: getRandomItem(cities[country]),
            bio: `I'm a test user from ${country}. Let's see if we click!`,
            profileCompleted: true,
            isVerified: false,
            showAllCountries: false
          }
        })

        console.log(`  ✓ Created: ${newUser.name}`)
        totalUsersCreated++

        // Create a match between current user and this new user
        const match = await prisma.match.create({
          data: {
            userId: currentUser.id,
            matchedUserId: newUser.id
          }
        })

        console.log(`  ✓ Created match between ${currentUser.name} and ${newUser.name}`)
        totalMatchesCreated++
      }
    }

    console.log(`\n✅ Seeding complete!`)
    console.log(`📊 Summary:`)
    console.log(`   - Users created: ${totalUsersCreated}`)
    console.log(`   - Matches created: ${totalMatchesCreated}`)
    console.log(`\n🎯 You can now visit the Outcomes page to report outcomes on these matches!`)

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedTestUsers()
