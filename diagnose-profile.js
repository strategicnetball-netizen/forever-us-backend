import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnoseProfile() {
  try {
    // Get the first user (you)
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!user) {
      console.log('No users found')
      process.exit(0)
    }

    console.log('\n=== USER PROFILE DATA ===')
    console.log(`ID: ${user.id}`)
    console.log(`Name: ${user.name}`)
    console.log(`Age: ${user.age}`)
    console.log(`Gender: ${user.gender}`)
    console.log(`Country: ${user.country}`)
    console.log(`State: ${user.state}`)
    console.log(`City: ${user.city}`)
    console.log(`Bio: ${user.bio}`)
    console.log(`Photos: ${user.photos ? 'YES' : 'NO'}`)
    console.log(`Profile Completed: ${user.profileCompleted}`)

    // Calculate what the frontend would calculate
    let completedFields = 0
    const totalFields = 5

    if (user.name && user.name.trim()) completedFields++
    if (user.age && user.age > 0) completedFields++
    if (user.gender && user.gender.trim()) completedFields++
    if (user.country && user.country.trim()) completedFields++
    if (user.city && user.city.trim()) completedFields++
    if (user.bio && user.bio.trim()) completedFields++

    const percentage = Math.round((completedFields / totalFields) * 100)

    console.log(`\n=== COMPLETION CALCULATION ===`)
    console.log(`Completed fields: ${completedFields}`)
    console.log(`Total fields: ${totalFields}`)
    console.log(`Percentage: ${percentage}%`)

    console.log(`\n=== FIELD BREAKDOWN ===`)
    console.log(`Name: ${user.name ? '✓' : '✗'}`)
    console.log(`Age: ${user.age && user.age > 0 ? '✓' : '✗'}`)
    console.log(`Gender: ${user.gender ? '✓' : '✗'}`)
    console.log(`Country: ${user.country ? '✓' : '✗'}`)
    console.log(`City: ${user.city ? '✓' : '✗'}`)
    console.log(`Bio: ${user.bio ? '✓' : '✗'}`)

    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

diagnoseProfile()
