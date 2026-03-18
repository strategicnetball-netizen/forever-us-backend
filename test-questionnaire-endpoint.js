import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuestionnaireEndpoint() {
  try {
    console.log('=== QUESTIONNAIRE DATA VERIFICATION ===\n');

    // Get a user with questionnaire
    const user = await prisma.user.findFirst({
      include: { questionnaire: true }
    });

    if (!user || !user.questionnaire) {
      console.log('No user with questionnaire found');
      return;
    }

    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
    console.log('\n--- Raw Database Data ---');
    
    const answers = JSON.parse(user.questionnaire.answers);
    console.log('Total questions answered:', Object.keys(answers).length);
    
    console.log('\n--- All Answers ---');
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

    QUESTIONS.forEach((question, idx) => {
      const qNum = idx + 1;
      const answerKey = `q${qNum}`;
      const answer = answers[answerKey];
      
      console.log(`\nQ${qNum}: ${question}`);
      console.log(`Key: ${answerKey}`);
      console.log(`Type: ${Array.isArray(answer) ? 'Array' : typeof answer}`);
      console.log(`Value: ${Array.isArray(answer) ? JSON.stringify(answer) : answer}`);
    });

    console.log('\n\n=== WHAT FRONTEND SHOULD DISPLAY ===\n');
    console.log('The frontend should display each answer correctly:');
    console.log('- String answers as plain text');
    console.log('- Array answers as tags/badges');
    console.log('\nExample:');
    console.log('Q1: What\'s your ideal first date?');
    console.log(`Answer: ${answers.q1}`);
    console.log('\nQ2: What\'s your biggest life goal?');
    console.log(`Answer: ${JSON.stringify(answers.q2)}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testQuestionnaireEndpoint();
