import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test ads
  const adData = [
    {
      title: 'Premium Dating App',
      description: 'Check out our premium features',
      duration: 15,
      rewardPoints: 10,
      videoUrl: 'https://example.com/ad1.mp4',
      isActive: true
    },
    {
      title: 'Dating Tips & Tricks',
      description: 'Learn how to improve your dating profile',
      duration: 20,
      rewardPoints: 15,
      videoUrl: 'https://example.com/ad2.mp4',
      isActive: true
    },
    {
      title: 'Success Stories',
      description: 'Watch real couples share their stories',
      duration: 30,
      rewardPoints: 25,
      videoUrl: 'https://example.com/ad3.mp4',
      isActive: true
    },
    {
      title: 'Travel & Romance',
      description: 'Discover romantic destinations',
      duration: 25,
      rewardPoints: 20,
      videoUrl: 'https://example.com/ad4.mp4',
      isActive: true
    },
    {
      title: 'Relationship Advice',
      description: 'Expert tips for lasting relationships',
      duration: 45,
      rewardPoints: 35,
      videoUrl: 'https://example.com/ad5.mp4',
      isActive: true
    },
    {
      title: 'Love Stories Documentary',
      description: 'Inspiring stories from real couples',
      duration: 60,
      rewardPoints: 45,
      videoUrl: 'https://example.com/ad6.mp4',
      isActive: true
    }
  ]

  for (const ad of adData) {
    try {
      await prisma.ad.create({ data: ad })
      console.log(`Created ad: ${ad.title}`)
    } catch (err) {
      console.log(`Ad already exists: ${ad.title}`)
    }
  }

  // Create test surveys
  const surveyData = [
    {
      title: 'Dating Preferences Survey',
      description: 'Help us understand your dating preferences',
      rewardPoints: 15,
      questions: JSON.stringify([
        {
          text: 'What is your ideal first date?',
          options: ['Dinner', 'Coffee', 'Activity', 'Walk']
        },
        {
          text: 'How important is physical attraction?',
          options: ['Very Important', 'Somewhat Important', 'Not Important']
        },
        {
          text: 'What are you looking for?',
          options: ['Casual Dating', 'Serious Relationship', 'Not Sure']
        }
      ]),
      isActive: true
    },
    {
      title: 'Lifestyle & Interests',
      description: 'Tell us about your lifestyle',
      rewardPoints: 15,
      questions: JSON.stringify([
        {
          text: 'How often do you exercise?',
          options: ['Daily', '3-4 times a week', '1-2 times a week', 'Rarely']
        },
        {
          text: 'What is your favorite hobby?',
          options: ['Sports', 'Arts', 'Travel', 'Gaming', 'Reading']
        },
        {
          text: 'Do you prefer city or countryside?',
          options: ['City', 'Countryside', 'Suburbs', 'No preference']
        }
      ]),
      isActive: true
    },
    {
      title: 'Values & Goals',
      description: 'Share your values and life goals',
      rewardPoints: 15,
      questions: JSON.stringify([
        {
          text: 'What is most important to you?',
          options: ['Family', 'Career', 'Travel', 'Personal Growth', 'Relationships']
        },
        {
          text: 'Do you want to have children?',
          options: ['Yes', 'No', 'Maybe', 'Undecided']
        },
        {
          text: 'What is your ideal life in 5 years?',
          options: ['Married', 'Established Career', 'Travel', 'Own a Home', 'Still Figuring Out']
        }
      ]),
      isActive: true
    }
  ]

  for (const survey of surveyData) {
    try {
      await prisma.survey.create({ data: survey })
      console.log(`Created survey: ${survey.title}`)
    } catch (err) {
      console.log(`Survey already exists: ${survey.title}`)
    }
  }

  console.log('Seed completed!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
