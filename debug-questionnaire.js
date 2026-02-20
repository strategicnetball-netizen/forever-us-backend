import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugQuestionnaire() {
  try {
    // Get the first user's questionnaire
    const questionnaire = await prisma.questionnaire.findFirst();
    
    if (!questionnaire) {
      console.log('No questionnaires found');
      return;
    }
    
    console.log('User ID:', questionnaire.userId);
    console.log('\nStored answers:');
    const answers = JSON.parse(questionnaire.answers);
    console.log(JSON.stringify(answers, null, 2));
    
    console.log('\n\nExpected keys:');
    const expectedKeys = [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10',
      'q11', 'q12', 'q13', 'q14',
      'open1', 'open2', 'open3', 'open4', 'open5', 'open6'
    ];
    expectedKeys.forEach((key, idx) => {
      const question = idx + 1;
      const value = answers[key];
      console.log(`Q${question} (${key}): ${JSON.stringify(value)}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuestionnaire();
