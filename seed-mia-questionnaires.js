import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const personalityAnswers = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 }
const relationshipGoalsAnswers = { q1: 2, q2: 4, q3: 1, q4: 5, q5: 3, q6: 2, q7: 4, q8: 1, q9: 5, q10: 3 }
const lifestyleAnswers = { q1: 4, q2: 1, q3: 5, q4: 2, q5: 4, q6: 1, q7: 5, q8: 2, q9: 4, q10: 1 }
const valuesBelifsAnswers = { q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, q6: 4, q7: 3, q8: 2, q9: 1, q10: 5 }
const interestsHobbiesAnswers = { q1: 5, q2: 4, q3: 3, q4: 2, q5: 1, q6: 2, q7: 3, q8: 4, q9: 5, q10: 1 }
const musicPersonalityAnswers = { q1: 2, q2: 4, q3: 1, q4: 5, q5: 3, q6: 2, q7: 4, q8: 1, q9: 5, q10: 3 }

const intimatePreferencesData = {
  dominanceSubmission: { preference: 'Switch', experience: 'Experienced' },
  bondage: { interest: 'Yes', comfort: 'Moderate' },
  roleplay: { interest: 'Yes', scenarios: 'Various' },
  voyeurism: { interest: 'Maybe', comfort: 'Low' },
  communicationStyle: { style: 'Direct', frequency: 'Regular' },
  boundaries: { limits: 'Discussed beforehand', safeword: 'Yes' },
  frequency: { preference: 'Weekly', flexibility: 'Flexible' },
  customNotes: 'Open to exploring new things with the right partner',
  isPublic: true
}

async function seedMiaQuestionnaires() {
  try {
    console.log('Seeding questionnaires for Mia...')

    // Find Mia
    const mia = await prisma.user.findUnique({
      where: { email: 'mia@test.com' }
    })

    if (!mia) {
      console.log('Mia not found')
      return
    }

    console.log(`Found Mia: ${mia.name} (${mia.email})`)

    // Create all 6 questionnaires
    try {
      await prisma.personalityQuestionnaire.upsert({
        where: { userId: mia.id },
        update: { answers: JSON.stringify(personalityAnswers) },
        create: { userId: mia.id, answers: JSON.stringify(personalityAnswers) }
      })
      console.log('✓ Created personality questionnaire for Mia')
    } catch (err) {
      console.log('Error creating personality:', err.message)
    }

    try {
      await prisma.relationshipGoalsQuestionnaire.upsert({
        where: { userId: mia.id },
        update: { answers: JSON.stringify(relationshipGoalsAnswers) },
        create: { userId: mia.id, answers: JSON.stringify(relationshipGoalsAnswers) }
      })
      console.log('✓ Created relationship goals questionnaire for Mia')
    } catch (err) {
      console.log('Error creating relationship goals:', err.message)
    }

    try {
      await prisma.lifestyleQuestionnaire.upsert({
        where: { userId: mia.id },
        update: { answers: JSON.stringify(lifestyleAnswers) },
        create: { userId: mia.id, answers: JSON.stringify(lifestyleAnswers) }
      })
      console.log('✓ Created lifestyle questionnaire for Mia')
    } catch (err) {
      console.log('Error creating lifestyle:', err.message)
    }

    try {
      await prisma.valuesBelifsQuestionnaire.upsert({
        where: { userId: mia.id },
        update: { answers: JSON.stringify(valuesBelifsAnswers) },
        create: { userId: mia.id, answers: JSON.stringify(valuesBelifsAnswers) }
      })
      console.log('✓ Created values & beliefs questionnaire for Mia')
    } catch (err) {
      console.log('Error creating values & beliefs:', err.message)
    }

    try {
      await prisma.interestsHobbiesQuestionnaire.upsert({
        where: { userId: mia.id },
        update: { answers: JSON.stringify(interestsHobbiesAnswers) },
        create: { userId: mia.id, answers: JSON.stringify(interestsHobbiesAnswers) }
      })
      console.log('✓ Created interests & hobbies questionnaire for Mia')
    } catch (err) {
      console.log('Error creating interests & hobbies:', err.message)
    }

    try {
      await prisma.musicPersonalityQuestionnaire.upsert({
        where: { userId: mia.id },
        update: { answers: JSON.stringify(musicPersonalityAnswers) },
        create: { userId: mia.id, answers: JSON.stringify(musicPersonalityAnswers) }
      })
      console.log('✓ Created music personality questionnaire for Mia')
    } catch (err) {
      console.log('Error creating music personality:', err.message)
    }

    // Create intimate preferences
    try {
      await prisma.intimatePreferences.upsert({
        where: { userId: mia.id },
        update: {
          dominanceSubmission: JSON.stringify(intimatePreferencesData.dominanceSubmission),
          bondage: JSON.stringify(intimatePreferencesData.bondage),
          roleplay: JSON.stringify(intimatePreferencesData.roleplay),
          voyeurism: JSON.stringify(intimatePreferencesData.voyeurism),
          communicationStyle: JSON.stringify(intimatePreferencesData.communicationStyle),
          boundaries: JSON.stringify(intimatePreferencesData.boundaries),
          frequency: JSON.stringify(intimatePreferencesData.frequency),
          customNotes: intimatePreferencesData.customNotes,
          isPublic: intimatePreferencesData.isPublic
        },
        create: {
          userId: mia.id,
          dominanceSubmission: JSON.stringify(intimatePreferencesData.dominanceSubmission),
          bondage: JSON.stringify(intimatePreferencesData.bondage),
          roleplay: JSON.stringify(intimatePreferencesData.roleplay),
          voyeurism: JSON.stringify(intimatePreferencesData.voyeurism),
          communicationStyle: JSON.stringify(intimatePreferencesData.communicationStyle),
          boundaries: JSON.stringify(intimatePreferencesData.boundaries),
          frequency: JSON.stringify(intimatePreferencesData.frequency),
          customNotes: intimatePreferencesData.customNotes,
          isPublic: intimatePreferencesData.isPublic
        }
      })
      console.log('✓ Created intimate preferences for Mia')
    } catch (err) {
      console.log('Error creating intimate preferences:', err.message)
    }

    console.log('✓ Mia questionnaires seeded successfully!')
  } catch (err) {
    console.error('Seed error:', err)
    throw err
  }
}

seedMiaQuestionnaires()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
