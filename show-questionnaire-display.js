import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function showDisplay() {
  try {
    const q = await prisma.questionnaire.findFirst();
    
    if (!q) {
      console.log('No questionnaires found');
      return;
    }

    const answers = JSON.parse(q.answers);
    
    console.log('=== HOW PROFILE PAGE SHOULD DISPLAY ===\n');
    console.log('User: Sarah (user1@example.com)\n');
    
    QUESTIONS.forEach((question, idx) => {
      const qNum = idx + 1;
      const answerKey = `q${qNum}`;
      const answer = answers[answerKey];
      
      console.log(`${qNum}. ${question}`);
      
      if (Array.isArray(answer)) {
        console.log(`   Tags: ${answer.join(', ')}`);
      } else {
        console.log(`   ${answer}`);
      }
      console.log('');
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

showDisplay();
