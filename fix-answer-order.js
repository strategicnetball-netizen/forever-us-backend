import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAnswerOrder() {
  try {
    const questionnaires = await prisma.questionnaire.findMany();
    
    console.log(`Found ${questionnaires.length} questionnaires to check...`);
    
    for (const q of questionnaires) {
      let answers = JSON.parse(q.answers);
      
      // Check if answers are shifted (q1 has value that should be in q2, etc.)
      // We'll detect this by checking if the first answer looks like it belongs to q2
      const keys = Object.keys(answers).filter(k => k.startsWith('q')).sort((a, b) => {
        const numA = parseInt(a.substring(1));
        const numB = parseInt(b.substring(1));
        return numA - numB;
      });
      
      if (keys.length === 0) continue;
      
      // Get all values in order
      const values = keys.map(k => answers[k]);
      
      // Check if this looks like it's shifted - if q1 is an array and q2 is a string, likely shifted
      let isShifted = false;
      
      // Better detection: if we have more than 20 keys or if the pattern looks wrong
      if (keys.length > 20) {
        console.log(`User ${q.userId}: Has ${keys.length} keys (should be 20), likely shifted`);
        isShifted = true;
      }
      
      if (isShifted) {
        // Shift all answers back by one position
        const shifted = {};
        for (let i = 0; i < keys.length - 1; i++) {
          const currentKey = keys[i];
          const nextKey = keys[i + 1];
          shifted[currentKey] = answers[nextKey];
        }
        // The last key gets the first value
        shifted[keys[keys.length - 1]] = answers[keys[0]];
        
        console.log(`  Shifting answers for user ${q.userId}`);
        
        await prisma.questionnaire.update({
          where: { userId: q.userId },
          data: { answers: JSON.stringify(shifted) }
        });
      }
    }
    
    console.log('✓ Done checking answer order!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixAnswerOrder();
