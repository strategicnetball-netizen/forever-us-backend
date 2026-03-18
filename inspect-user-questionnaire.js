import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectQuestionnaire() {
  try {
    // Get the first user with a questionnaire
    const q = await prisma.questionnaire.findFirst();
    
    if (!q) {
      console.log('No questionnaires found');
      return;
    }

    console.log('User ID:', q.userId);
    console.log('\nRaw answers string:');
    console.log(q.answers);
    
    console.log('\n\nParsed answers:');
    const parsed = JSON.parse(q.answers);
    console.log(JSON.stringify(parsed, null, 2));
    
    console.log('\n\nKeys in order:');
    Object.keys(parsed).forEach((key, idx) => {
      console.log(`${idx}: "${key}" => ${typeof parsed[key] === 'object' ? JSON.stringify(parsed[key]) : parsed[key]}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectQuestionnaire();
