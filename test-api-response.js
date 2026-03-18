import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get first user
    const user = await prisma.user.findFirst({
      where: { email: 'user1@example.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    // Get questionnaire
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { userId: user.id }
    });

    if (!questionnaire) {
      console.log('Questionnaire not found');
      return;
    }

    console.log('=== API Response Simulation ===');
    console.log('GET /questionnaire/:userId');
    console.log('\nResponse:');
    
    const QUESTIONS = [
      "What's your ideal first date?",
      "What's your biggest life goal?",
      "How do you spend your weekends?",
      "What's your favorite travel destination?",
      "What's your relationship with your family like?",
      "What's your career ambition?",
      "How important is fitness to you?",
      "What's your favorite type of cuisine?",
      "Do you want kids in the future?",
      "What's your love language?",
      "How do you handle conflict?",
      "What's your ideal vacation?",
      "What's your biggest pet peeve?",
      "How important is religion/spirituality?",
      "What's your favorite hobby?",
      "How do you define success?",
      "What's your biggest fear?",
      "How important is financial stability?",
      "What's your ideal partner's personality?",
      "What's your life motto?"
    ];

    const response = {
      questions: QUESTIONS,
      answers: JSON.parse(questionnaire.answers)
    };

    console.log(JSON.stringify(response, null, 2));

    // Now simulate what Profile.jsx does
    console.log('\n=== Profile.jsx Processing ===');
    let parsed = JSON.parse(questionnaire.answers);
    const hasNumericKeys = Object.keys(parsed).some(key => !isNaN(key) && key !== '');
    const hasNewKeys = Object.keys(parsed).some(key => key.startsWith('q'));
    
    console.log('Has numeric keys:', hasNumericKeys);
    console.log('Has q-prefixed keys:', hasNewKeys);
    
    if (hasNumericKeys && !hasNewKeys) {
      console.log('Converting from numeric to q-prefixed keys...');
      const converted = {};
      for (let i = 0; i < 20; i++) {
        converted[`q${i + 1}`] = parsed[i] || '';
      }
      parsed = converted;
    }

    console.log('\nFinal parsed questionnaire:');
    console.log(JSON.stringify(parsed, null, 2));

    // Display as it would appear on profile
    console.log('\n=== Profile Display ===');
    QUESTIONS.forEach((question, idx) => {
      const qNum = idx + 1;
      const answerKey = `q${qNum}`;
      const answer = parsed[answerKey];
      console.log(`${qNum}. ${question}`);
      if (Array.isArray(answer)) {
        console.log(`   Answer: [${answer.join(', ')}]`);
      } else {
        console.log(`   Answer: ${answer || 'Not answered'}`);
      }
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
