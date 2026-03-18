import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The correct question order
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

async function fixAlignment() {
  try {
    console.log('Analyzing questionnaire data corruption...\n');

    const questionnaires = await prisma.questionnaire.findMany();
    console.log(`Found ${questionnaires.length} questionnaires\n`);

    let corrupted = 0;
    let valid = 0;

    for (const q of questionnaires) {
      const answers = JSON.parse(q.answers);
      const keys = Object.keys(answers);
      
      // Check if data looks corrupted
      // Corrupted data will have answers that don't match question types
      // For example, Q7 "How important is fitness?" should have values like "Very important", "Important", etc.
      // But if it has "Weekend trips", that's clearly wrong
      
      const q7Answer = answers.q7;
      const q4Answer = answers.q4;
      
      // Q7 should be about fitness importance (dropdown with: Very important, Important, Somewhat important, Not very important, Not important)
      // Q4 should be a travel destination (text)
      
      // If Q7 contains "Weekend trips" or "Adventure travel", it's corrupted
      // If Q4 contains fitness-related words, it's corrupted
      
      const fitnessKeywords = ['fitness', 'important', 'exercise', 'gym', 'active'];
      const travelKeywords = ['trip', 'travel', 'destination', 'adventure', 'beach', 'mountain', 'city'];
      
      let isCorrupted = false;
      
      if (Array.isArray(q7Answer)) {
        const q7Str = q7Answer.join(' ').toLowerCase();
        if (travelKeywords.some(kw => q7Str.includes(kw))) {
          isCorrupted = true;
        }
      }
      
      if (Array.isArray(q4Answer)) {
        const q4Str = q4Answer.join(' ').toLowerCase();
        if (fitnessKeywords.some(kw => q4Str.includes(kw))) {
          isCorrupted = true;
        }
      }
      
      if (isCorrupted) {
        corrupted++;
        console.log(`❌ User ${q.userId}: CORRUPTED`);
        console.log(`   Q4 (travel): ${Array.isArray(q4Answer) ? JSON.stringify(q4Answer) : q4Answer}`);
        console.log(`   Q7 (fitness): ${Array.isArray(q7Answer) ? JSON.stringify(q7Answer) : q7Answer}`);
      } else {
        valid++;
      }
    }

    console.log(`\n\nSummary:`);
    console.log(`- Valid questionnaires: ${valid}`);
    console.log(`- Corrupted questionnaires: ${corrupted}`);
    
    if (corrupted > 0) {
      console.log(`\n⚠️  Found ${corrupted} corrupted questionnaires!`);
      console.log('These need to be deleted so users can re-answer.');
      console.log('\nTo fix, run: node delete-corrupted-questionnaires.js');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixAlignment();
