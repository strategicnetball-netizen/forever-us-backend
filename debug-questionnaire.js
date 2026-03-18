import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get first user's questionnaire
    const questionnaire = await prisma.questionnaire.findFirst({
      include: { user: { select: { email: true } } }
    });

    if (questionnaire) {
      console.log('User:', questionnaire.user.email);
      console.log('Raw answers string:', questionnaire.answers);
      console.log('\nParsed answers:');
      const parsed = JSON.parse(questionnaire.answers);
      console.log(JSON.stringify(parsed, null, 2));
      console.log('\nKeys in parsed object:', Object.keys(parsed));
    } else {
      console.log('No questionnaire found');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
