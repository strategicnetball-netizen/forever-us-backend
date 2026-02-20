import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser20() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'user20@example.com' },
      include: { questionnaire: true }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User:', user.email);
    console.log('User ID:', user.id);
    
    if (!user.questionnaire) {
      console.log('No questionnaire found');
      return;
    }
    
    const answers = JSON.parse(user.questionnaire.answers);
    console.log('\nAll answers:');
    console.log(JSON.stringify(answers, null, 2));
    
    console.log('\n\nQuestion-Answer pairs:');
    const questions = [
      "1. What's your ideal first date?",
      "2. What's your biggest life goal?",
      "3. How do you spend your weekends?",
      "4. What's your favorite travel destination?",
      "5. What's your relationship with your family like?",
      "6. What's your career ambition?",
      "7. How important is fitness to you?",
      "8. What's your favorite type of cuisine?",
      "9. Do you want kids in the future?",
      "10. What's your love language?",
      "11. How do you handle conflict?",
      "12. What's your ideal vacation?",
      "13. What's your biggest pet peeve?",
      "14. How important is religion/spirituality?",
      "15. What's your favorite hobby?",
      "16. How do you define success?",
      "17. What's your biggest fear?",
      "18. How important is financial stability?",
      "19. What's your ideal partner's personality?",
      "20. What's your life motto?"
    ];
    
    for (let i = 0; i < 20; i++) {
      const key = `q${i + 1}`;
      const value = answers[key];
      console.log(`${questions[i]}`);
      console.log(`  Answer: ${Array.isArray(value) ? value.join(', ') : value}`);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser20();
