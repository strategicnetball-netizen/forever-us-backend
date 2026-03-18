import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding user red flags...');

    // Get all red flags
    const redFlags = await prisma.redFlagsList.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    if (redFlags.length === 0) {
      console.log('No red flags found. Please seed red flags first.');
      return;
    }

    console.log(`Found ${redFlags.length} red flags`);

    // Get all test users
    const users = await prisma.user.findMany({
      where: {
        email: {
          startsWith: 'user'
        }
      }
    });

    console.log(`Found ${users.length} test users`);

    // For each user, select 2-4 random red flags
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Select 2-4 random red flags
      const numFlags = Math.floor(Math.random() * 3) + 2; // 2-4
      const selectedFlags = [];
      
      for (let j = 0; j < numFlags; j++) {
        const randomIndex = Math.floor(Math.random() * redFlags.length);
        const flag = redFlags[randomIndex];
        if (!selectedFlags.includes(flag.flag)) {
          selectedFlags.push(flag.flag);
        }
      }

      // Create or update red flags questionnaire
      await prisma.redFlagsQuestionnaire.upsert({
        where: { userId: user.id },
        update: {
          selectedFlags: JSON.stringify(selectedFlags),
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          selectedFlags: JSON.stringify(selectedFlags)
        }
      });

      console.log(`✓ ${user.email}: ${selectedFlags.join(', ')}`);
    }

    console.log('\n✓ Seeded red flags for all test users');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
