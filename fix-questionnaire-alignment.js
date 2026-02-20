import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixQuestionnaires() {
  try {
    const questionnaires = await prisma.questionnaire.findMany();
    
    console.log(`Found ${questionnaires.length} questionnaires to check...`);
    
    for (const q of questionnaires) {
      let answers = JSON.parse(q.answers);
      let needsUpdate = false;
      
      // Check if answers have numeric keys (old format)
      const hasNumericKeys = Object.keys(answers).some(key => !isNaN(key) && key !== '');
      const hasNewKeys = Object.keys(answers).some(key => key.startsWith('q') || key.startsWith('open'));
      
      if (hasNumericKeys && !hasNewKeys) {
        console.log(`Converting questionnaire for user ${q.userId} from old format...`);
        
        // Convert from numeric keys to q1-q14, open1-open6 format
        const converted = {};
        for (let i = 0; i < 20; i++) {
          const key = i < 14 ? `q${i + 1}` : `open${i - 13}`;
          converted[key] = answers[i] || '';
        }
        
        answers = converted;
        needsUpdate = true;
      }
      
      // Verify all 20 keys exist
      const expectedKeys = [
        'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10',
        'q11', 'q12', 'q13', 'q14',
        'open1', 'open2', 'open3', 'open4', 'open5', 'open6'
      ];
      
      for (const key of expectedKeys) {
        if (!(key in answers)) {
          console.log(`  Missing key: ${key} for user ${q.userId}`);
          answers[key] = '';
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await prisma.questionnaire.update({
          where: { userId: q.userId },
          data: { answers: JSON.stringify(answers) }
        });
        console.log(`  ✓ Updated questionnaire for user ${q.userId}`);
      }
    }
    
    console.log('✓ All questionnaires fixed!');
  } catch (err) {
    console.error('Error fixing questionnaires:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixQuestionnaires();
