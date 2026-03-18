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
    const locations = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Canberra', 'Gold Coast', 'Newcastle', 'Wollongong', 'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho', 'Nha Trang', 'Hue', 'Danang', 'Vung Tau', 'Phu Quoc', 'Bondi', 'Manly', 'Surfers Paradise'];
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
    // Question types from Questionnaire.jsx:
    // Q1: text, Q2: dropdown, Q3: dropdown, Q4: text, Q5: dropdown, Q6: text, Q7: dropdown, Q8: dropdown
    // Q9: dropdown, Q10: dropdown, Q11: dropdown, Q12: dropdown, Q13: text, Q14: dropdown, Q15: dropdown
    // Q16: text, Q17: text, Q18: dropdown, Q19: text, Q20: text
    const answers = Array(30).fill(null).map((_, idx) => ({
      q1: idx % 3 === 0 ? 'Dinner at a nice restaurant' : idx % 3 === 1 ? 'Movie and drinks' : 'Outdoor activity like hiking',
      q2: idx % 3 === 0 ? ['Career success'] : idx % 3 === 1 ? ['Family'] : ['Travel'],
      q3: idx % 3 === 0 ? ['Outdoors/Adventure'] : idx % 3 === 1 ? ['With friends/family'] : ['Relaxing at home'],
      q4: idx % 2 === 0 ? 'Spontaneous and adventurous' : 'Planned and thoughtful',
      q5: idx % 3 === 0 ? ['Very close'] : idx % 3 === 1 ? ['Close'] : ['Moderate'],
      q6: idx % 2 === 0 ? 'Entrepreneurship' : 'Making a positive impact',
      q7: idx % 3 === 0 ? ['Very important'] : idx % 3 === 1 ? ['Important'] : ['Somewhat important'],
      q8: idx % 3 === 0 ? ['Italian'] : idx % 3 === 1 ? ['Asian'] : ['Mexican'],
      q9: idx % 3 === 0 ? ['Yes, definitely'] : idx % 3 === 1 ? ['Maybe'] : ['Undecided'],
      q10: idx % 3 === 0 ? ['Words of affirmation - Compliments and verbal appreciation'] : idx % 3 === 1 ? ['Acts of service - Helping with tasks and making life easier'] : ['Quality time - Undivided attention and meaningful moments'],
      q11: idx % 3 === 0 ? ['Direct communication'] : idx % 3 === 1 ? ['Take time to cool off'] : ['Seek compromise'],
      q12: idx % 3 === 0 ? ['Beach/Resort'] : idx % 3 === 1 ? ['Mountain/Hiking'] : ['City exploration'],
      q13: idx % 3 === 0 ? 'Dishonesty and lack of integrity' : idx % 3 === 1 ? 'Disrespect and rudeness' : 'Negativity and complaining',
      q14: idx % 3 === 0 ? ['Ambitious'] : idx % 3 === 1 ? ['Creative'] : ['Thoughtful'],
      q15: idx % 3 === 0 ? ['Sports'] : idx % 3 === 1 ? ['Reading'] : ['Art/Music'],
      q16: 'Achieving personal goals and helping others succeed',
      q17: 'Failure and not reaching my potential',
      q18: idx % 3 === 0 ? ['Very important'] : idx % 3 === 1 ? ['Important'] : ['Somewhat important'],
      q19: 'Someone kind, genuine, and ambitious',
      q20: 'Live fully and love deeply'
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
