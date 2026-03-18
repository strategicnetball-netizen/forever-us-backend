import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RED_FLAGS = [
  'Dishonesty or lying',
  'Excessive drinking or substance abuse',
  'Controlling behavior',
  'Poor communication',
  'Lack of respect for boundaries',
  'Infidelity or cheating',
  'Anger management issues',
  'Unwillingness to commit',
  'Financial irresponsibility',
  'Disrespect toward family',
  'Excessive jealousy',
  'Lack of ambition',
  'Poor hygiene',
  'Addiction issues',
  'Emotional unavailability',
  'Manipulation tactics',
  'Disrespect toward others',
  'Avoidance of responsibility',
  'Excessive social media use',
  'Lack of empathy'
]

const DEAL_BREAKERS = [
  'Wants children (when I don\'t)',
  'Doesn\'t want children (when I do)',
  'Different religious beliefs',
  'Incompatible life goals',
  'Unwilling to relocate',
  'Active addiction',
  'History of infidelity',
  'Significant age gap',
  'Different financial values',
  'Unwilling to compromise',
  'Unresolved trauma',
  'Poor relationship with family',
  'Lack of emotional intelligence',
  'Incompatible career ambitions',
  'Different views on marriage',
  'Unwilling to work on relationship',
  'Toxic family dynamics',
  'Dishonesty about past',
  'Incompatible lifestyle choices'
]

async function main() {
  try {
    console.log('Seeding red flags and deal breakers...')

    // Clear existing data
    await prisma.redFlagsList.deleteMany({})
    await prisma.dealBreakersList.deleteMany({})

    // Seed red flags
    for (let i = 0; i < RED_FLAGS.length; i++) {
      await prisma.redFlagsList.create({
        data: {
          flag: RED_FLAGS[i],
          order: i + 1,
          isActive: true
        }
      })
    }
    console.log(`✓ Seeded ${RED_FLAGS.length} red flags`)

    // Seed deal breakers
    for (let i = 0; i < DEAL_BREAKERS.length; i++) {
      await prisma.dealBreakersList.create({
        data: {
          breaker: DEAL_BREAKERS[i],
          order: i + 1,
          isActive: true
        }
      })
    }
    console.log(`✓ Seeded ${DEAL_BREAKERS.length} deal breakers`)

    console.log('✓ Seeding complete!')
  } catch (err) {
    console.error('Error seeding:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
