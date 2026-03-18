import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample data generators
const personalityTraits = ['Extrovert', 'Introvert', 'Ambivert', 'Empathetic', 'Analytical', 'Creative', 'Practical', 'Idealistic']
const relationshipGoals = ['Casual dating', 'Serious relationship', 'Marriage', 'Friendship', 'Networking', 'Long-term partnership']
const lifestyleActivities = ['Hiking', 'Cooking', 'Gaming', 'Reading', 'Traveling', 'Fitness', 'Art', 'Music', 'Sports', 'Movies']
const values = ['Honesty', 'Loyalty', 'Kindness', 'Ambition', 'Creativity', 'Intelligence', 'Humor', 'Compassion', 'Integrity', 'Growth']
const musicGenres = ['Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic', 'Country', 'R&B', 'Indie', 'Metal']

function getRandomItems(arr, count = 3) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function seedAllQuestionnaires() {
  try {
    console.log('Seeding all questionnaires for dummy users...')

    // Get all users
    const users = await prisma.user.findMany({
      where: { isAdmin: false }
    })

    console.log(`Found ${users.length} users to seed`)

    for (const user of users) {
      const userId = user.id

      // 1. Personality Questionnaire
      try {
        const personalityData = {
          openness: Math.floor(Math.random() * 100),
          conscientiousness: Math.floor(Math.random() * 100),
          extraversion: Math.floor(Math.random() * 100),
          agreeableness: Math.floor(Math.random() * 100),
          neuroticism: Math.floor(Math.random() * 100),
          dominantTrait: getRandomItem(personalityTraits),
          secondaryTrait: getRandomItem(personalityTraits),
          personalityType: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'][Math.floor(Math.random() * 16)],
          profileScore: 70 + Math.floor(Math.random() * 30),
          profileCompletion: 85 + Math.floor(Math.random() * 15)
        }
        await prisma.personalityQuestionnaire.upsert({
          where: { userId },
          update: {
            answers: JSON.stringify(personalityData)
          },
          create: {
            userId,
            answers: JSON.stringify(personalityData)
          }
        })
        console.log(`✓ Personality questionnaire for ${user.email}`)
      } catch (err) {
        console.log(`✗ Personality questionnaire for ${user.email}:`, err.message)
      }

      // 2. Relationship Goals Questionnaire
      try {
        await prisma.relationshipGoalsQuestionnaire.upsert({
          where: { userId },
          update: {
            answers: JSON.stringify({
              primaryGoal: getRandomItem(relationshipGoals),
              secondaryGoals: getRandomItems(relationshipGoals, 2),
              timeframe: getRandomItem(['Immediate', '3-6 months', '6-12 months', 'No rush']),
              dealBreakers: getRandomItems(values, 2),
              mustHaves: getRandomItems(values, 3),
              openToLongDistance: Math.random() > 0.5,
              wantChildren: getRandomItem(['Yes', 'No', 'Maybe', 'Already have'])
            })
          },
          create: {
            userId,
            answers: JSON.stringify({
              primaryGoal: getRandomItem(relationshipGoals),
              secondaryGoals: getRandomItems(relationshipGoals, 2),
              timeframe: getRandomItem(['Immediate', '3-6 months', '6-12 months', 'No rush']),
              dealBreakers: getRandomItems(values, 2),
              mustHaves: getRandomItems(values, 3),
              openToLongDistance: Math.random() > 0.5,
              wantChildren: getRandomItem(['Yes', 'No', 'Maybe', 'Already have'])
            })
          }
        })
        console.log(`✓ Relationship goals questionnaire for ${user.email}`)
      } catch (err) {
        console.log(`✗ Relationship goals questionnaire for ${user.email}:`, err.message)
      }

      // 3. Lifestyle Questionnaire
      try {
        await prisma.lifestyleQuestionnaire.upsert({
          where: { userId },
          update: {
            answers: JSON.stringify({
              favoriteActivities: getRandomItems(lifestyleActivities, 4),
              workLifeBalance: getRandomItem(['Work-focused', 'Balanced', 'Life-focused']),
              exerciseFrequency: getRandomItem(['Daily', '3-4x/week', '1-2x/week', 'Rarely']),
              dietaryPreferences: getRandomItem(['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian']),
              sleepSchedule: getRandomItem(['Early bird', 'Night owl', 'Flexible']),
              socialFrequency: getRandomItem(['Very social', 'Moderately social', 'Prefer small groups', 'Homebody']),
              travelFrequency: getRandomItem(['Constantly', 'Several times/year', 'Once/year', 'Rarely']),
              petOwner: Math.random() > 0.5,
              smokingStatus: getRandomItem(['Non-smoker', 'Occasional', 'Regular', 'Trying to quit']),
              drinkingHabits: getRandomItem(['Non-drinker', 'Social drinker', 'Regular drinker'])
            })
          },
          create: {
            userId,
            answers: JSON.stringify({
              favoriteActivities: getRandomItems(lifestyleActivities, 4),
              workLifeBalance: getRandomItem(['Work-focused', 'Balanced', 'Life-focused']),
              exerciseFrequency: getRandomItem(['Daily', '3-4x/week', '1-2x/week', 'Rarely']),
              dietaryPreferences: getRandomItem(['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian']),
              sleepSchedule: getRandomItem(['Early bird', 'Night owl', 'Flexible']),
              socialFrequency: getRandomItem(['Very social', 'Moderately social', 'Prefer small groups', 'Homebody']),
              travelFrequency: getRandomItem(['Constantly', 'Several times/year', 'Once/year', 'Rarely']),
              petOwner: Math.random() > 0.5,
              smokingStatus: getRandomItem(['Non-smoker', 'Occasional', 'Regular', 'Trying to quit']),
              drinkingHabits: getRandomItem(['Non-drinker', 'Social drinker', 'Regular drinker'])
            })
          }
        })
        console.log(`✓ Lifestyle questionnaire for ${user.email}`)
      } catch (err) {
        console.log(`✗ Lifestyle questionnaire for ${user.email}:`, err.message)
      }

      // 4. Values & Beliefs Questionnaire
      try {
        await prisma.valuesBelifsQuestionnaire.upsert({
          where: { userId },
          update: {
            answers: JSON.stringify({
              coreValues: getRandomItems(values, 5),
              religionSpirituality: getRandomItem(['Very religious', 'Spiritual', 'Agnostic', 'Atheist', 'Not important']),
              politicalLeaning: getRandomItem(['Very liberal', 'Liberal', 'Moderate', 'Conservative', 'Very conservative']),
              environmentalConcern: getRandomItem(['Very concerned', 'Somewhat concerned', 'Not concerned']),
              socialCause: getRandomItem(['Climate', 'Social justice', 'Education', 'Healthcare', 'Poverty', 'None']),
              moneyAttitude: getRandomItem(['Save aggressively', 'Balanced', 'Spend freely']),
              careerImportance: getRandomItem(['Very important', 'Important', 'Somewhat important', 'Not important']),
              familyValues: getRandomItem(['Very important', 'Important', 'Somewhat important', 'Not important']),
              friendshipValues: getRandomItem(['Very important', 'Important', 'Somewhat important', 'Not important'])
            })
          },
          create: {
            userId,
            answers: JSON.stringify({
              coreValues: getRandomItems(values, 5),
              religionSpirituality: getRandomItem(['Very religious', 'Spiritual', 'Agnostic', 'Atheist', 'Not important']),
              politicalLeaning: getRandomItem(['Very liberal', 'Liberal', 'Moderate', 'Conservative', 'Very conservative']),
              environmentalConcern: getRandomItem(['Very concerned', 'Somewhat concerned', 'Not concerned']),
              socialCause: getRandomItem(['Climate', 'Social justice', 'Education', 'Healthcare', 'Poverty', 'None']),
              moneyAttitude: getRandomItem(['Save aggressively', 'Balanced', 'Spend freely']),
              careerImportance: getRandomItem(['Very important', 'Important', 'Somewhat important', 'Not important']),
              familyValues: getRandomItem(['Very important', 'Important', 'Somewhat important', 'Not important']),
              friendshipValues: getRandomItem(['Very important', 'Important', 'Somewhat important', 'Not important'])
            })
          }
        })
        console.log(`✓ Values & beliefs questionnaire for ${user.email}`)
      } catch (err) {
        console.log(`✗ Values & beliefs questionnaire for ${user.email}:`, err.message)
      }

      // 5. Interests & Hobbies Questionnaire
      try {
        await prisma.interestsHobbiesQuestionnaire.upsert({
          where: { userId },
          update: {
            answers: JSON.stringify({
              topInterests: getRandomItems(lifestyleActivities, 5),
              favoriteBooks: getRandomItems(['Fiction', 'Non-fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Biography'], 2),
              favoriteMovies: getRandomItems(['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi'], 2),
              favoriteFood: getRandomItem(['Italian', 'Asian', 'Mexican', 'American', 'Mediterranean', 'Indian']),
              favoriteVacation: getRandomItem(['Beach', 'Mountains', 'City', 'Adventure', 'Cultural', 'Relaxation']),
              collectsAnything: Math.random() > 0.5,
              creativeHobbies: getRandomItems(['Painting', 'Writing', 'Music', 'Photography', 'Crafts', 'Cooking'], 2),
              sportsFan: Math.random() > 0.5,
              favoriteTeam: getRandomItem(['None', 'Local team', 'National team', 'International team']),
              gamesPlayed: getRandomItems(['Video games', 'Board games', 'Card games', 'Sports', 'Puzzles'], 2)
            })
          },
          create: {
            userId,
            answers: JSON.stringify({
              topInterests: getRandomItems(lifestyleActivities, 5),
              favoriteBooks: getRandomItems(['Fiction', 'Non-fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Biography'], 2),
              favoriteMovies: getRandomItems(['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi'], 2),
              favoriteFood: getRandomItem(['Italian', 'Asian', 'Mexican', 'American', 'Mediterranean', 'Indian']),
              favoriteVacation: getRandomItem(['Beach', 'Mountains', 'City', 'Adventure', 'Cultural', 'Relaxation']),
              collectsAnything: Math.random() > 0.5,
              creativeHobbies: getRandomItems(['Painting', 'Writing', 'Music', 'Photography', 'Crafts', 'Cooking'], 2),
              sportsFan: Math.random() > 0.5,
              favoriteTeam: getRandomItem(['None', 'Local team', 'National team', 'International team']),
              gamesPlayed: getRandomItems(['Video games', 'Board games', 'Card games', 'Sports', 'Puzzles'], 2)
            })
          }
        })
        console.log(`✓ Interests & hobbies questionnaire for ${user.email}`)
      } catch (err) {
        console.log(`✗ Interests & hobbies questionnaire for ${user.email}:`, err.message)
      }

      // 6. Music Personality Questionnaire
      try {
        await prisma.musicPersonalityQuestionnaire.upsert({
          where: { userId },
          update: {
            answers: JSON.stringify({
              favoriteGenres: getRandomItems(musicGenres, 3),
              musicRole: getRandomItem(['Listener', 'Player', 'Singer', 'Producer', 'Enthusiast']),
              concertFrequency: getRandomItem(['Regularly', 'Occasionally', 'Rarely', 'Never']),
              playInstrument: Math.random() > 0.5,
              instruments: getRandomItems(['Guitar', 'Piano', 'Drums', 'Violin', 'Bass', 'Vocals'], 2),
              musicMood: getRandomItem(['Energetic', 'Relaxing', 'Emotional', 'Motivational', 'Mixed']),
              musicImportance: getRandomItem(['Very important', 'Important', 'Somewhat important', 'Not important']),
              favoriteArtists: getRandomItems(['Pop star', 'Rock band', 'Hip-hop artist', 'Classical composer', 'Jazz musician'], 2),
              musicMemory: 'Music is a big part of my life'
            })
          },
          create: {
            userId,
            answers: JSON.stringify({
              favoriteGenres: getRandomItems(musicGenres, 3),
              musicRole: getRandomItem(['Listener', 'Player', 'Singer', 'Producer', 'Enthusiast']),
              concertFrequency: getRandomItem(['Regularly', 'Occasionally', 'Rarely', 'Never']),
              playInstrument: Math.random() > 0.5,
              instruments: getRandomItems(['Guitar', 'Piano', 'Drums', 'Violin', 'Bass', 'Vocals'], 2),
              musicMood: getRandomItem(['Energetic', 'Relaxing', 'Emotional', 'Motivational', 'Mixed']),
              musicImportance: getRandomItem(['Very important', 'Important', 'Somewhat important', 'Not important']),
              favoriteArtists: getRandomItems(['Pop star', 'Rock band', 'Hip-hop artist', 'Classical composer', 'Jazz musician'], 2),
              musicMemory: 'Music is a big part of my life'
            })
          }
        })
        console.log(`✓ Music personality questionnaire for ${user.email}`)
      } catch (err) {
        console.log(`✗ Music personality questionnaire for ${user.email}:`, err.message)
      }
    }

    console.log('\n✓ All questionnaires seeded successfully!')
  } catch (err) {
    console.error('Seeding error:', err)
    throw err
  } finally {
    await prisma.$disconnect()
  }
}

seedAllQuestionnaires()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
