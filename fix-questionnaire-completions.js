import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixQuestionnaireCompletions() {
  try {
    console.log('Starting questionnaire completion fix...')

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true }
    })

    console.log(`Found ${users.length} users`)

    for (const user of users) {
      const userId = user.id
      console.log(`\nProcessing user: ${userId}`)

      // Check each questionnaire type
      const types = [
        'personality',
        'relationship_goals',
        'lifestyle',
        'values_beliefs',
        'interests_hobbies',
        'music_personality',
        'lifestyle_preferences',
        'red_flags',
        'deal_breakers'
      ]

      for (const type of types) {
        let hasData = false

        // Check if questionnaire data exists
        if (type === 'personality') {
          const data = await prisma.personalityQuestionnaire.findUnique({ where: { userId } })
          hasData = !!data
        } else if (type === 'relationship_goals') {
          const data = await prisma.relationshipGoalsQuestionnaire.findUnique({ where: { userId } })
          hasData = !!data
        } else if (type === 'lifestyle') {
          const data = await prisma.lifestyleQuestionnaire.findUnique({ where: { userId } })
          hasData = !!data
        } else if (type === 'values_beliefs') {
          const data = await prisma.valuesBelifsQuestionnaire.findUnique({ where: { userId } })
          hasData = !!data
        } else if (type === 'interests_hobbies') {
          const data = await prisma.interestsHobbiesQuestionnaire.findUnique({ where: { userId } })
          hasData = !!data
        } else if (type === 'music_personality') {
          const data = await prisma.MusicPersonalityQuestionnaire.findUnique({ where: { userId } })
          hasData = !!data
        } else if (type === 'lifestyle_preferences') {
          const data = await prisma.lifestylePreferencesQuestionnaire.findUnique({ where: { userId } })
          hasData = !!data
        } else if (type === 'red_flags') {
          const data = await prisma.redFlagsQuestionnaire.findUnique({ where: { userId } })
          hasData = !!data
        } else if (type === 'deal_breakers') {
          const data = await prisma.dealBreakersQuestionnaire.findUnique({ where: { userId } })
          hasData = !!data
        }

        if (hasData) {
          // Update or create completion record
          await prisma.questionnaireCompletion.upsert({
            where: {
              userId_type: {
                userId,
                type
              }
            },
            update: {
              completed: true,
              completedAt: new Date(),
              coinsRewarded: 20
            },
            create: {
              userId,
              type,
              completed: true,
              completedAt: new Date(),
              coinsRewarded: 20
            }
          })
          console.log(`  ✓ ${type} - marked as completed`)
        }
      }
    }

    console.log('\n✓ Questionnaire completion fix completed!')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

fixQuestionnaireCompletions()
