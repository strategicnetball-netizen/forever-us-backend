import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteCorrupted() {
  try {
    console.log('Deleting corrupted questionnaires...\n');

    const questionnaires = await prisma.questionnaire.findMany();
    
    const travelKeywords = ['trip', 'travel', 'destination', 'adventure', 'beach', 'mountain', 'city'];
    const fitnessKeywords = ['fitness', 'important', 'exercise', 'gym', 'active'];
    
    let deletedCount = 0;
    const deletedUsers = [];

    for (const q of questionnaires) {
      const answers = JSON.parse(q.answers);
      const q7Answer = answers.q7;
      const q4Answer = answers.q4;
      
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
        await prisma.questionnaire.delete({
          where: { userId: q.userId }
        });
        deletedCount++;
        deletedUsers.push(q.userId);
        console.log(`✓ Deleted questionnaire for user ${q.userId}`);
      }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} corrupted questionnaires`);
    console.log('\nAffected users will need to re-answer the questionnaire.');
    console.log('Their "About Me" section will be empty until they do.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

deleteCorrupted();
