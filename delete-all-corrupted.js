import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAll() {
  try {
    console.log('Deleting ALL questionnaires with misaligned data...\n');

    // Simply delete all questionnaires - they're all corrupted
    // Users will re-answer fresh
    const result = await prisma.questionnaire.deleteMany({});
    
    console.log(`✅ Deleted ${result.count} questionnaires`);
    console.log('\nAll users will need to re-answer the questionnaire.');
    console.log('This ensures fresh, correctly-aligned data going forward.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAll();
