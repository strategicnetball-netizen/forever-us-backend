import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample answers for different questionnaire types
const personalityAnswers = [
  { q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, q6: 4, q7: 3, q8: 2, q9: 1, q10: 5 },
  { q1: 5, q2: 4, q3: 3, q4: 2, q5: 1, q6: 2, q7: 3, q8: 4, q9: 5, q10: 1 },
  { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 },
  { q1: 2, q2: 4, q3: 1, q4: 5, q5: 3, q6: 2, q7: 4, q8: 1, q9: 5, q10: 3 },
  { q1: 4, q2: 1, q3: 5, q4: 2, q5: 4, q6: 1, q7: 5, q8: 2, q9: 4, q10: 1 },
]

const relationshipGoalsAnswers = [
  { q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, q6: 4, q7: 3, q8: 2, q9: 1, q10: 5 },
  { q1: 5, q2: 4, q3: 3, q4: 2, q5: 1, q6: 2, q7: 3, q8: 4, q9: 5, q10: 1 },
  { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 },
  { q1: 2, q2: 4, q3: 1, q4: 5, q5: 3, q6: 2, q7: 4, q8: 1, q9: 5, q10: 3 },
  { q1: 4, q2: 1, q3: 5, q4: 2, q5: 4, q6: 1, q7: 5, q8: 2, q9: 4, q10: 1 },
]

const lifestyleAnswers = [
  { q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, q6: 4, q7: 3, q8: 2, q9: 1, q10: 5 },
  { q1: 5, q2: 4, q3: 3, q4: 2, q5: 1, q6: 2, q7: 3, q8: 4, q9: 5, q10: 1 },
  { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 },
  { q1: 2, q2: 4, q3: 1, q4: 5, q5: 3, q6: 2, q7: 4, q8: 1, q9: 5, q10: 3 },
  { q1: 4, q2: 1, q3: 5, q4: 2, q5: 4, q6: 1, q7: 5, q8: 2, q9: 4, q10: 1 },
]

const valuesBelifsAnswers = [
  { q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, q6: 4, q7: 3, q8: 2, q9: 1, q10: 5 },
  { q1: 5, q2: 4, q3: 3, q4: 2, q5: 1, q6: 2, q7: 3, q8: 4, q9: 5, q10: 1 },
  { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 },
  { q1: 2, q2: 4, q3: 1, q4: 5, q5: 3, q6: 2, q7: 4, q8: 1, q9: 5, q10: 3 },
  { q1: 4, q2: 1, q3: 5, q4: 2, q5: 4, q6: 1, q7: 5, q8: 2, q9: 4, q10: 1 },
]

const interestsHobbiesAnswers = [
  { q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, q6: 4, q7: 3, q8: 2, q9: 1, q10: 5 },
  { q1: 5, q2: 4, q3: 3, q4: 2, q5: 1, q6: 2, q7: 3, q8: 4, q9: 5, q10: 1 },
  { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 },
  { q1: 2, q2: 4, q3: 1, q4: 5, q5: 3, q6: 2, q7: 4, q8: 1, q9: 5, q10: 3 },
  { q1: 4, q2: 1, q3: 5, q4: 2, q5: 4, q6: 1, q7: 5, q8: 2, q9: 4, q10: 1 },
]

const musicPersonalityAnswers = [
  { q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, q6: 4, q7: 3, q8: 2, q9: 1, q10: 5 },
  { q1: 5, q2: 4, q3: 3, q4: 2, q5: 1, q6: 2, q7: 3, q8: 4, q9: 5, q10: 1 },
  { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 },
  { q1: 2, q2: 4, q3: 1, q4: 5, q5: 3, q6: 2, q7: 4, q8: 1, q9: 5, q10: 3 },
  { q1: 4, q2: 1, q3: 5, q4: 2, q5: 4, q6: 1, q7: 5, q8: 2, q9: 4, q10: 1 },
]

const intimatePreferencesData = [
  {
    dominanceSubmission: { preference: 'Switch', experience: 'Experienced' },
    bondage: { interest: 'Yes', comfort: 'Moderate' },
    roleplay: { interest: 'Yes', scenarios: 'Various' },
    voyeurism: { interest: 'Maybe', comfort: 'Low' },
    communicationStyle: { style: 'Direct', frequency: 'Regular' },
    boundaries: { limits: 'Discussed beforehand', safeword: 'Yes' },
    frequency: { preference: 'Weekly', flexibility: 'Flexible' },
    customNotes: 'Open to exploring new things with the right partner',
    isPublic: true
  },
  {
    dominanceSubmission: { preference: 'Dominant', experience: 'Very experienced' },
    bondage: { interest: 'Yes', comfort: 'High' },
    roleplay: { interest: 'Yes', scenarios: 'Power dynamics' },
    voyeurism: { interest: 'Yes', comfort: 'High' },
    communicationStyle: { style: 'Assertive', frequency: 'Ongoing' },
    boundaries: { limits: 'Well established', safeword: 'Yes' },
    frequency: { preference: 'Frequent', flexibility: 'Strict' },
    customNotes: 'Looking for submissive partners who enjoy being guided',
    isPublic: true
  },
  {
    dominanceSubmission: { preference: 'Submissive', experience: 'Moderate' },
    bondage: { interest: 'Maybe', comfort: 'Low' },
    roleplay: { interest: 'Yes', scenarios: 'Romantic' },
    voyeurism: { interest: 'No', comfort: 'None' },
    communicationStyle: { style: 'Gentle', frequency: 'Before and after' },
    boundaries: { limits: 'Strict', safeword: 'Yes' },
    frequency: { preference: 'Occasional', flexibility: 'Very flexible' },
    customNotes: 'Prefer emotional connection with physical intimacy',
    isPublic: true
  },
  {
    dominanceSubmission: { preference: 'Switch', experience: 'Exploring' },
    bondage: { interest: 'Maybe', comfort: 'Moderate' },
    roleplay: { interest: 'Yes', scenarios: 'Fantasy' },
    voyeurism: { interest: 'Maybe', comfort: 'Moderate' },
    communicationStyle: { style: 'Open', frequency: 'Continuous' },
    boundaries: { limits: 'Flexible', safeword: 'Yes' },
    frequency: { preference: 'Regular', flexibility: 'Flexible' },
    customNotes: 'Still learning what I enjoy, open to communication',
    isPublic: true
  },
  {
    dominanceSubmission: { preference: 'Dominant', experience: 'Experienced' },
    bondage: { interest: 'Yes', comfort: 'High' },
    roleplay: { interest: 'Yes', scenarios: 'Various' },
    voyeurism: { interest: 'Yes', comfort: 'Moderate' },
    communicationStyle: { style: 'Direct', frequency: 'Regular' },
    boundaries: { limits: 'Discussed', safeword: 'Yes' },
    frequency: { preference: 'Weekly', flexibility: 'Somewhat flexible' },
    customNotes: 'Experienced and looking for compatible partners',
    isPublic: true
  },
]

async function seedQuestionnaires() {
  try {
    console.log('Starting questionnaire seeding...')

    // First, create additional premium and VIP users
    console.log('Creating additional premium and VIP users...')
    
    // Create 10 premium users
    for (let i = 1; i <= 10; i++) {
      await prisma.user.upsert({
        where: { email: `premium${i}@example.com` },
        update: {},
        create: {
          email: `premium${i}@example.com`,
          password: 'password123',
          name: `Premium User ${i}`,
          age: 25 + i,
          gender: i % 2 === 0 ? 'woman' : 'man',
          location: `City ${i}`,
          country: 'USA',
          city: `City ${i}`,
          tier: 'premium',
          profileCompleted: true
        }
      })
    }

    // Create 10 VIP users
    for (let i = 1; i <= 10; i++) {
      await prisma.user.upsert({
        where: { email: `vip${i}@example.com` },
        update: {},
        create: {
          email: `vip${i}@example.com`,
          password: 'password123',
          name: `VIP User ${i}`,
          age: 28 + i,
          gender: i % 2 === 0 ? 'man' : 'woman',
          location: `Premium City ${i}`,
          country: 'USA',
          city: `Premium City ${i}`,
          tier: 'vip',
          profileCompleted: true
        }
      })
    }

    console.log('✓ Created additional premium and VIP users')

    // Get all users except admin
    const users = await prisma.user.findMany({
      where: {
        email: { not: 'admin@admin.com' }
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`Found ${users.length} users to seed`)

    let completedCount = 0

    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const answerIndex = i % 5 // Cycle through 5 different answer sets

      try {
        // Personality Questionnaire
        await prisma.personalityQuestionnaire.upsert({
          where: { userId: user.id },
          update: {
            answers: JSON.stringify(personalityAnswers[answerIndex]),
            completedAt: new Date()
          },
          create: {
            userId: user.id,
            answers: JSON.stringify(personalityAnswers[answerIndex]),
            completedAt: new Date()
          }
        })

        // Relationship Goals Questionnaire
        await prisma.relationshipGoalsQuestionnaire.upsert({
          where: { userId: user.id },
          update: {
            answers: JSON.stringify(relationshipGoalsAnswers[answerIndex]),
            completedAt: new Date()
          },
          create: {
            userId: user.id,
            answers: JSON.stringify(relationshipGoalsAnswers[answerIndex]),
            completedAt: new Date()
          }
        })

        // Lifestyle Questionnaire
        await prisma.lifestyleQuestionnaire.upsert({
          where: { userId: user.id },
          update: {
            answers: JSON.stringify(lifestyleAnswers[answerIndex]),
            completedAt: new Date()
          },
          create: {
            userId: user.id,
            answers: JSON.stringify(lifestyleAnswers[answerIndex]),
            completedAt: new Date()
          }
        })

        // Values & Beliefs Questionnaire
        await prisma.valuesBelifsQuestionnaire.upsert({
          where: { userId: user.id },
          update: {
            answers: JSON.stringify(valuesBelifsAnswers[answerIndex]),
            completedAt: new Date()
          },
          create: {
            userId: user.id,
            answers: JSON.stringify(valuesBelifsAnswers[answerIndex]),
            completedAt: new Date()
          }
        })

        // Interests & Hobbies Questionnaire
        await prisma.interestsHobbiesQuestionnaire.upsert({
          where: { userId: user.id },
          update: {
            answers: JSON.stringify(interestsHobbiesAnswers[answerIndex]),
            completedAt: new Date()
          },
          create: {
            userId: user.id,
            answers: JSON.stringify(interestsHobbiesAnswers[answerIndex]),
            completedAt: new Date()
          }
        })

        // Music Personality Questionnaire
        await prisma.musicPersonalityQuestionnaire.upsert({
          where: { userId: user.id },
          update: {
            answers: JSON.stringify(musicPersonalityAnswers[answerIndex]),
            completedAt: new Date()
          },
          create: {
            userId: user.id,
            answers: JSON.stringify(musicPersonalityAnswers[answerIndex]),
            completedAt: new Date()
          }
        })

        // Intimate Preferences (only for 21+ users)
        if (user.age >= 21) {
          const intimateData = intimatePreferencesData[answerIndex]
          await prisma.intimatePreferences.upsert({
            where: { userId: user.id },
            update: {
              dominanceSubmission: JSON.stringify(intimateData.dominanceSubmission),
              bondage: JSON.stringify(intimateData.bondage),
              roleplay: JSON.stringify(intimateData.roleplay),
              voyeurism: JSON.stringify(intimateData.voyeurism),
              communicationStyle: JSON.stringify(intimateData.communicationStyle),
              boundaries: JSON.stringify(intimateData.boundaries),
              frequency: JSON.stringify(intimateData.frequency),
              customNotes: intimateData.customNotes,
              isPublic: intimateData.isPublic
            },
            create: {
              userId: user.id,
              dominanceSubmission: JSON.stringify(intimateData.dominanceSubmission),
              bondage: JSON.stringify(intimateData.bondage),
              roleplay: JSON.stringify(intimateData.roleplay),
              voyeurism: JSON.stringify(intimateData.voyeurism),
              communicationStyle: JSON.stringify(intimateData.communicationStyle),
              boundaries: JSON.stringify(intimateData.boundaries),
              frequency: JSON.stringify(intimateData.frequency),
              customNotes: intimateData.customNotes,
              isPublic: intimateData.isPublic
            }
          })
        }

        // Mark questionnaire completion
        const questionnaires = ['personality', 'relationship_goals', 'lifestyle', 'values_beliefs', 'interests_hobbies', 'music_personality']
        for (const type of questionnaires) {
          await prisma.questionnaireCompletion.upsert({
            where: {
              userId_type: {
                userId: user.id,
                type
              }
            },
            update: {
              completed: true,
              completedAt: new Date(),
              coinsRewarded: 50
            },
            create: {
              userId: user.id,
              type,
              completed: true,
              completedAt: new Date(),
              coinsRewarded: 50
            }
          })
        }

        completedCount++
        console.log(`✓ Completed questionnaires for ${user.email} (${user.tier})`)
      } catch (err) {
        console.error(`✗ Failed to seed questionnaires for ${user.email}:`, err.message)
      }
    }

    console.log(`\n✓ Seeding complete! ${completedCount}/${users.length} users updated`)
    console.log('\nUser breakdown:')
    const tiers = await prisma.user.groupBy({
      by: ['tier'],
      where: { email: { not: 'admin@admin.com' } },
      _count: true
    })
    tiers.forEach(t => {
      console.log(`  ${t.tier.toUpperCase()}: ${t._count} users`)
    })
  } catch (err) {
    console.error('Seeding failed:', err)
  } finally {
    await prisma.$disconnect()
  }
}

seedQuestionnaires()
