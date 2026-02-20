import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {},
      create: {
        email: 'admin@admin.com',
        password: adminPassword,
        name: 'Admin User',
        points: 1000,
        age: 30,
        gender: 'other',
        location: 'Admin City',
        isAdmin: true,
        adminProfile: {
          create: {
            phone: '+1-555-0100',
            role: 'super_admin',
            department: 'Administration'
          }
        }
      }
    });

    console.log('Created admin:', admin.email);

    const names = ['Sarah', 'Emma', 'Jessica', 'Ashley', 'Michelle', 'Lauren', 'Amanda', 'Stephanie', 'Jennifer', 'Nicole', 'David', 'James', 'Michael', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Rachel', 'Megan', 'Lisa', 'Karen', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Donna', 'Carol'];
    const bios = [
      'Love hiking and outdoor adventures',
      'Foodie who enjoys trying new restaurants',
      'Yoga enthusiast and nature lover',
      'Travel blogger exploring the world',
      'Artist and creative soul',
      'Fitness enthusiast and gym regular',
      'Book lover and coffee addict',
      'Music lover and concert goer',
      'Photography enthusiast',
      'Cooking is my passion',
      'Adventure seeker and thrill lover',
      'Homebody who loves movies',
      'Gym rat and fitness coach',
      'Entrepreneur and business minded',
      'Dog lover and animal advocate',
      'Beach person and water sports fan',
      'Wine tasting enthusiast',
      'Volunteer and community helper',
      'Gaming and tech enthusiast',
      'Dancer and performer',
      'Passionate about environmental conservation',
      'Love spending time with family and friends',
      'Aspiring writer and storyteller',
      'Fitness coach and wellness advocate',
      'Outdoor enthusiast and nature photographer',
      'Culinary artist and food blogger',
      'Spiritual and mindfulness practitioner',
      'Tech entrepreneur and innovator',
      'Charity worker and social activist',
      'Musician and music producer'
    ];
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'Portland', 'Miami', 'Atlanta', 'Nashville', 'New Orleans', 'Las Vegas', 'Salt Lake City', 'Tucson', 'Albuquerque', 'Sacramento', 'Long Beach'];
    const avatars = Array.from({ length: 30 }, (_, i) => `https://i.pravatar.cc/150?img=${i + 1}`);

    const testUsers = [];
    for (let i = 1; i <= 30; i++) {
      const password = await bcrypt.hash('password123', 10);
      const tier = i === 1 ? 'premium' : i === 2 ? 'vip' : 'free';
      try {
        const user = await prisma.user.create({
          data: {
            email: `user${i}@example.com`,
            password,
            name: names[i - 1],
            bio: bios[i - 1],
            age: 22 + (i % 18),
            gender: i % 2 === 0 ? 'female' : 'male',
            location: locations[i - 1],
            avatar: avatars[i - 1],
            points: i === 1 ? 0 : i === 2 ? 0 : 50,
            tier,
            isAdmin: false
          }
        });
        testUsers.push(user);
        console.log('Created user:', user.email, `(${tier})`);
      } catch (err) {
        const user = await prisma.user.findUnique({
          where: { email: `user${i}@example.com` }
        });
        if (user) {
          testUsers.push(user);
          console.log('User already exists:', user.email);
        }
      }
    }

    // Create 30 questionnaire answers
    const answers = Array(30).fill(null).map((_, idx) => ({
      q1: idx % 3 === 0 ? 'Dinner' : idx % 3 === 1 ? 'Movie' : 'Outdoor activity',
      q2: idx % 2 === 0 ? ['Trust'] : ['Communication'],
      q3: idx % 2 === 0 ? ['Yes'] : ['No'],
      q4: idx % 2 === 0 ? 'Spontaneous' : 'Planned',
      q5: idx % 3 === 0 ? ['Extrovert'] : idx % 3 === 1 ? ['Introvert'] : ['Ambivert'],
      q6: idx % 2 === 0 ? 'Yes' : 'No',
      q7: idx % 4 === 0 ? ['Weekend trips'] : idx % 4 === 1 ? ['Cozy nights'] : idx % 4 === 2 ? ['Adventure travel'] : ['Cultural events'],
      q8: idx % 2 === 0 ? ['Casual'] : ['Serious'],
      q9: idx % 2 === 0 ? ['Yes'] : ['No'],
      q10: idx % 3 === 0 ? ['Honesty'] : idx % 3 === 1 ? ['Loyalty'] : ['Respect'],
      q11: idx % 3 === 0 ? ['Active'] : idx % 3 === 1 ? ['Relaxed'] : ['Moderate'],
      q12: idx % 2 === 0 ? 'Yes' : 'No',
      q13: idx % 3 === 0 ? 'Humor' : idx % 3 === 1 ? 'Intelligence' : 'Kindness',
      q14: idx % 3 === 0 ? ['Ambitious'] : idx % 3 === 1 ? ['Creative'] : ['Thoughtful'],
      q15: idx % 3 === 0 ? ['Sports'] : idx % 3 === 1 ? ['Reading'] : ['Art/Music'],
      q16: 'Success through growth',
      q17: 'Failure',
      q18: idx % 3 === 0 ? ['Very important'] : idx % 3 === 1 ? ['Important'] : ['Somewhat important'],
      q19: 'Someone kind and genuine',
      q20: 'Live fully'
    }));

    for (let i = 0; i < testUsers.length; i++) {
      try {
        await prisma.questionnaire.create({
          data: {
            userId: testUsers[i].id,
            answers: JSON.stringify(answers[i])
          }
        });
        console.log('Created questionnaire for:', testUsers[i].email);
      } catch (err) {
        console.log('Error creating questionnaire for:', testUsers[i].email, err.message);
      }
    }

    console.log('Seeding completed!');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
