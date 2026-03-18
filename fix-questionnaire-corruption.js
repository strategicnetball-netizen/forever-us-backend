import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixQuestionnaireCorruption() {
  try {
    console.log('Starting questionnaire corruption fix...');

    // Get all questionnaires
    const questionnaires = await prisma.questionnaire.findMany();
    console.log(`Found ${questionnaires.length} questionnaires`);

    let fixedCount = 0;
    let deletedCount = 0;

    for (const q of questionnaires) {
      try {
        const answers = JSON.parse(q.answers);
        
        // Check if answers are corrupted (numeric indices instead of q1, q2, etc.)
        const hasNumericKeys = Object.keys(answers).some(key => !isNaN(key) && key !== '');
        const hasProperKeys = Object.keys(answers).some(key => key.startsWith('q'));

        if (hasNumericKeys && !hasProperKeys) {
          console.log(`Deleting corrupted questionnaire for user ${q.userId}`);
          await prisma.questionnaire.delete({
            where: { userId: q.userId }
          });
          deletedCount++;
        } else if (hasNumericKeys && hasProperKeys) {
          // Mixed format - delete and let user re-answer
          console.log(`Deleting mixed-format questionnaire for user ${q.userId}`);
          await prisma.questionnaire.delete({
            where: { userId: q.userId }
          });
          deletedCount++;
        } else {
          console.log(`Questionnaire for user ${q.userId} appears valid`);
          fixedCount++;
        }
      } catch (err) {
        console.error(`Error processing questionnaire for user ${q.userId}:`, err.message);
      }
    }

    console.log(`\nFix complete:`);
    console.log(`- Valid questionnaires kept: ${fixedCount}`);
    console.log(`- Corrupted questionnaires deleted: ${deletedCount}`);
    console.log(`\nUsers with deleted questionnaires will need to re-answer the questionnaire.`);

  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixQuestionnaireCorruption();
