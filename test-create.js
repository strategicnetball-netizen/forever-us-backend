import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing user creation...');
  
  try {
    const password = await bcrypt.hash('test123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        password,
        name: 'Test User',
        age: 25,
        gender: 'male',
        location: 'Test City'
      }
    });
    console.log('Created user:', user.id, user.email);
    
    // Now create questionnaire
    const q = await prisma.questionnaire.create({
      data: {
        userId: user.id,
        answers: JSON.stringify({ q1: 'Test', q15: 'Test15', q20: 'Test20' })
      }
    });
    console.log('Created questionnaire:', q.id);
    
    // Fetch it back
    const fetched = await prisma.questionnaire.findUnique({
      where: { userId: user.id }
    });
    console.log('Fetched questionnaire:', fetched);
    const answers = JSON.parse(fetched.answers);
    console.log('q15:', answers.q15);
    console.log('q20:', answers.q20);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
