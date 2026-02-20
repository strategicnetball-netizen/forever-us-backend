import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUser20() {
  try {
    // Get user20
    const user = await prisma.user.findUnique({
      where: { email: 'user20@example.com' }
    });
    
    if (!user) {
      console.log('User20 not found');
      return;
    }
    
    // User20 is the 20th user, so index 19
    // But we only have 15 answer sets, so use index 19 % 15 = 4
    // But actually, looking at the pattern, user20 has answers[1]
    // which suggests they should have answers[19 % 15] = answers[4]
    
    // Let's use the correct answer set for user20 (index 19, but cycling through 15 sets)
    const correctAnswerIndex = 19 % 15; // = 4
    
    const correctAnswers = {
      q1: 'Dinner',
      q2: ['Trust'],
      q3: ['Yes'],
      q4: 'Spontaneous',
      q5: ['Extrovert'],
      q6: 'Yes',
      q7: ['Beach trips'],
      q8: ['Casual'],
      q9: ['Yes'],
      q10: ['Honesty'],
      q11: ['Very active'],
      q12: 'Yes',
      q13: 'Humor',
      q14: ['Ambitious'],
      q15: ['Sports'],
      q16: 'Health and fitness',
      q17: 'Illness',
      q18: ['Very important'],
      q19: 'Someone fit',
      q20: 'Stay healthy'
    };
    
    await prisma.questionnaire.update({
      where: { userId: user.id },
      data: { answers: JSON.stringify(correctAnswers) }
    });
    
    console.log('✓ Fixed user20 answers');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser20();
