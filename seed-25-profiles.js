import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const femaleNames = ['Sarah', 'Emma', 'Jessica', 'Ashley', 'Michelle', 'Lauren', 'Amanda', 'Stephanie', 'Jennifer', 'Nicole', 'Rachel', 'Megan', 'Lisa', 'Karen'];
const maleNames = ['David', 'James', 'Michael', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kevin'];

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
  'Outdoor enthusiast',
  'Spiritual and mindful',
  'Comedy lover and funny person',
  'Nature photographer',
  'Wellness coach'
];

const locations = [
  'New York, USA',
  'Los Angeles, USA',
  'Chicago, USA',
  'Houston, USA',
  'Phoenix, USA',
  'Philadelphia, USA',
  'San Antonio, USA',
  'San Diego, USA',
  'Dallas, USA',
  'San Jose, USA',
  'Austin, USA',
  'Jacksonville, USA',
  'Fort Worth, USA',
  'Columbus, USA',
  'Charlotte, USA',
  'San Francisco, USA',
  'Indianapolis, USA',
  'Seattle, USA',
  'Denver, USA',
  'Boston, USA',
  'Miami, USA',
  'Atlanta, USA',
  'Portland, USA',
  'Nashville, USA',
  'Detroit, USA'
];

const countries = ['USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA', 'USA'];

// Generate diverse avatar URLs
const getAvatarUrl = (index, gender) => {
  const baseIndex = index + 1;
  return `https://i.pravatar.cc/150?img=${baseIndex}&u=${gender}`;
};

// Generate diverse photos
const getPhotos = (index) => {
  const photoUrls = [
    `https://picsum.photos/400/500?random=${index * 3}`,
    `https://picsum.photos/400/500?random=${index * 3 + 1}`,
    `https://picsum.photos/400/500?random=${index * 3 + 2}`
  ];
  return JSON.stringify(photoUrls);
};

// Questionnaire answers - varied responses
const generateAnswers = (index) => {
  const answers = {
    // Questionnaire 1
    q1: ['Dinner', 'Movie', 'Outdoor activity', 'Coffee'][index % 4],
    q2: [['Trust'], ['Communication'], ['Humor'], ['Attraction']][index % 4],
    q3: [['Yes'], ['No'], ['Yes'], ['Maybe']][index % 4],
    q4: ['Spontaneous', 'Planned', 'Spontaneous', 'Flexible'][index % 4],
    q5: [['Extrovert'], ['Introvert'], ['Ambivert'], ['Extrovert']][index % 4],
    q6: ['Yes', 'No', 'Yes', 'Sometimes'][index % 4],
    q7: [['Weekend trips'], ['Cozy nights'], ['Adventure travel'], ['Cultural events']][index % 4],
    q8: [['Casual'], ['Serious'], ['Casual'], ['Casual']][index % 4],
    q9: [['Yes'], ['No'], ['Yes'], ['Yes']][index % 4],
    q10: [['Honesty'], ['Loyalty'], ['Ambition'], ['Respect']][index % 4],
    
    // Questionnaire 2 - Personality
    q11: [['Very active'], ['Relaxed'], ['Moderate'], ['Very active']][index % 4],
    q12: ['Yes', 'No', 'Yes', 'Yes'][index % 4],
    q13: ['Humor', 'Intelligence', 'Kindness', 'Authenticity'][index % 4],
    q14: [['Ambitious'], ['Creative'], ['Driven'], ['Thoughtful']][index % 4],
    q15: [['Sports'], ['Reading'], ['Travel'], ['Art/Music']][index % 4],
    
    // Questionnaire 3 - Relationship Goals
    q16: ['Success through growth', 'Making a difference', 'Living adventures', 'Creative expression'][index % 4],
    q17: ['Failure', 'Loneliness', 'Stagnation', 'Losing passion'][index % 4],
    q18: [['Very important'], ['Important'], ['Somewhat important'], ['Very important']][index % 4],
    q19: ['Someone kind and genuine', 'Someone thoughtful', 'Someone adventurous', 'Someone artistic'][index % 4],
    q20: ['Live fully', 'Quality over quantity', 'Carpe diem', 'Create beauty'][index % 4],
    
    // Lifestyle Preferences
    lifestyle_smoking: ['No', 'Socially', 'Yes', 'No'][index % 4],
    lifestyle_drinking: ['Socially', 'Regularly', 'Rarely', 'Socially'][index % 4],
    lifestyle_exercise: ['Daily', '3-4 times/week', '1-2 times/week', 'Daily'][index % 4],
    lifestyle_diet: ['Omnivore', 'Vegetarian', 'Vegan', 'Omnivore'][index % 4],
    
    // Red Flags
    red_flags: [
      ['Dishonesty', 'Disrespect'],
      ['Lack of ambition', 'Negativity'],
      ['Controlling behavior', 'Infidelity'],
      ['Substance abuse', 'Anger issues']
    ][index % 4],
    
    // Deal Breakers
    deal_breakers: [
      ['Wants children', 'Religious differences'],
      ['No ambition', 'Excessive drinking'],
      ['Infidelity', 'Dishonesty'],
      ['Controlling', 'Substance abuse']
    ][index % 4]
  };
  
  return answers;
};

async function main() {
  console.log('🌱 Starting seed for 25 profiles with photos and questionnaires...');
  
  let createdCount = 0;
  
  for (let i = 0; i < 25; i++) {
    try {
      const isFemale = i % 2 === 0;
      const name = isFemale ? femaleNames[i % femaleNames.length] : maleNames[i % maleNames.length];
      const gender = isFemale ? 'woman' : 'man';
      const password = await bcrypt.hash('password123', 10);
      
      // Vary tiers: 2 premium, 2 vip, rest free
      let tier = 'free';
      if (i === 0) tier = 'premium';
      if (i === 1) tier = 'vip';
      
      const user = await prisma.user.create({
        data: {
          email: `profile${i + 1}@example.com`,
          password,
          name: `${name} ${i + 1}`,
          bio: bios[i % bios.length],
          age: 22 + (i % 20),
          gender,
          location: locations[i],
          country: countries[i],
          city: locations[i].split(',')[0],
          avatar: getAvatarUrl(i, gender),
          photos: getPhotos(i),
          points: tier === 'premium' ? 0 : tier === 'vip' ? 0 : 50,
          tier,
          profileCompleted: true,
          isVerified: i % 3 === 0, // Verify some profiles
          lookingFor: JSON.stringify(gender === 'woman' ? ['Man'] : ['Woman']),
          lastActivityDate: new Date()
        }
      });
      
      // Create main questionnaire
      const answers = generateAnswers(i);
      
      await prisma.questionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify(answers)
        }
      });
      
      // Create personality questionnaire
      await prisma.personalityQuestionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify({
            type: ['ENFP', 'INTJ', 'ESFP', 'ISFJ'][i % 4],
            traits: [['Outgoing', 'Creative'], ['Analytical', 'Independent'], ['Spontaneous', 'Social'], ['Loyal', 'Practical']][i % 4]
          })
        }
      });
      
      // Create relationship goals questionnaire
      await prisma.relationshipGoalsQuestionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify({
            goal: ['Long-term relationship', 'Marriage', 'Dating casually', 'Long-term relationship'][i % 4],
            timeline: ['Within a year', 'No rush', 'ASAP', 'Within a year'][i % 4]
          })
        }
      });
      
      // Create lifestyle questionnaire
      await prisma.lifestyleQuestionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify({
            smoking: answers.lifestyle_smoking,
            drinking: answers.lifestyle_drinking,
            exercise: answers.lifestyle_exercise,
            diet: answers.lifestyle_diet
          })
        }
      });
      
      // Create values/beliefs questionnaire
      await prisma.valuesBelifsQuestionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify({
            religion: ['Christian', 'Agnostic', 'Atheist', 'Spiritual'][i % 4],
            politics: ['Liberal', 'Conservative', 'Moderate', 'Liberal'][i % 4],
            values: [['Family', 'Honesty'], ['Career', 'Growth'], ['Adventure', 'Freedom'], ['Community', 'Kindness']][i % 4]
          })
        }
      });
      
      // Create interests/hobbies questionnaire
      await prisma.interestsHobbiesQuestionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify({
            interests: [['Travel', 'Cooking'], ['Reading', 'Gaming'], ['Sports', 'Music'], ['Art', 'Photography']][i % 4],
            hobbies: [['Hiking', 'Yoga'], ['Gaming', 'Movies'], ['Fitness', 'Dancing'], ['Photography', 'Painting']][i % 4]
          })
        }
      });
      
      // Create music personality questionnaire
      await prisma.musicPersonalityQuestionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify({
            favoriteGenres: [['Pop', 'Rock'], ['Hip-hop', 'R&B'], ['Jazz', 'Classical'], ['Electronic', 'Indie']][i % 4],
            musicRole: ['Listener', 'Musician', 'Dancer', 'Listener'][i % 4]
          })
        }
      });
      
      // Create lifestyle preferences questionnaire
      await prisma.lifestylePreferencesQuestionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify({
            workLifeBalance: ['Work is important', 'Balance is key', 'Life comes first', 'Balance is key'][i % 4],
            socialLife: ['Very social', 'Selective', 'Quiet', 'Very social'][i % 4],
            travelFrequency: ['Often', 'Sometimes', 'Rarely', 'Often'][i % 4]
          })
        }
      });
      
      // Create red flags questionnaire
      await prisma.redFlagsQuestionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify({
            redFlags: answers.red_flags
          })
        }
      });
      
      // Create deal breakers questionnaire
      await prisma.dealBreakersQuestionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify({
            dealBreakers: answers.deal_breakers
          })
        }
      });
      
      createdCount++;
      console.log(`✅ Created profile ${i + 1}/25: ${user.name} (${gender}, ${user.age})`);
      
    } catch (err) {
      console.error(`❌ Error creating profile ${i + 1}:`, err.message);
    }
  }
  
  console.log(`\n🎉 Seed completed! Created ${createdCount}/25 profiles with photos and all questionnaires.`);
}

main()
  .catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
