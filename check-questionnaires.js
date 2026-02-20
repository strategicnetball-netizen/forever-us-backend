import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const questionnaires = await prisma.questionnaire.findMany({
      select: { userId: true, answers: true }
    });
    
    console.log('Total questionnaires:', questionnaires.length);
    
    if (questionnaires.length > 0) {
      console.log('\nFirst 5 questionnaires:');
      questionnaires.slice(0, 5).forEach(q => {
        const answers = JSON.parse(q.answers);
        console.log(`User ${q.userId}: has ${Object.keys(answers).length} answers`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
