import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const redFlags = await prisma.redFlagsList.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    console.log('Red Flags in database:');
    console.log(JSON.stringify(redFlags, null, 2));
    console.log(`\nTotal: ${redFlags.length} red flags`);

    // Check if any user has red flags selected
    const userWithFlags = await prisma.redFlagsQuestionnaire.findFirst();
    console.log('\nSample user red flags questionnaire:');
    console.log(JSON.stringify(userWithFlags, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
