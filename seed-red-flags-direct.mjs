import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Clearing existing red flags and deal breakers...');
    await prisma.redFlagsList.deleteMany({});
    await prisma.dealBreakersList.deleteMany({});

    const redFlags = [
      'Poor communication',
      'Dishonesty',
      'Lack of ambition',
      'Disrespectful behavior',
      'Excessive drinking',
      'Drug use',
      'Controlling behavior',
      'Infidelity',
      'Poor hygiene',
      'Arrogance',
      'Lack of empathy',
      'Financial irresponsibility',
      'Anger management issues',
      'Excessive social media use',
      'Unwillingness to compromise',
      'Laziness',
      'Rudeness to service workers',
      'Excessive flirting',
      'Lack of goals',
      'Emotional unavailability'
    ];

    console.log('Creating red flags...');
    for (let i = 0; i < redFlags.length; i++) {
      await prisma.redFlagsList.create({
        data: {
          flag: redFlags[i],
          isActive: true,
          order: i
        }
      });
    }
    console.log('Created', redFlags.length, 'red flags');

    const dealBreakers = [
      'Wants children',
      'Does not want children',
      'Smoker',
      'Non-smoker',
      'Heavy drinker',
      'Non-drinker',
      'Drug user',
      'Anti-drug',
      'Unemployed',
      'Workaholic',
      'Religious',
      'Atheist',
      'Wants marriage',
      'Does not want marriage',
      'Has children',
      'Does not have children',
      'Long-distance relationship',
      'Must live nearby',
      'Vegan/Vegetarian',
      'Meat eater'
    ];

    console.log('Creating deal breakers...');
    for (let i = 0; i < dealBreakers.length; i++) {
      await prisma.dealBreakersList.create({
        data: {
          breaker: dealBreakers[i],
          isActive: true,
          order: i
        }
      });
    }
    console.log('Created', dealBreakers.length, 'deal breakers');

    // Verify
    const flagCount = await prisma.redFlagsList.count();
    const breakerCount = await prisma.dealBreakersList.count();
    console.log('\nVerification:');
    console.log('Red flags in DB:', flagCount);
    console.log('Deal breakers in DB:', breakerCount);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
