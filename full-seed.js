import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const names = ['Sarah', 'Emma', 'Jessica', 'Ashley', 'Michelle', 'Lauren', 'Amanda', 'Stephanie', 'Jennifer', 'Nicole', 'David', 'James', 'Michael', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven'];
const bios = ['Love hiking and outdoor adventures', 'Foodie who enjoys trying new restaurants', 'Yoga enthusiast and nature lover', 'Travel blogger exploring the world', 'Artist and creative soul', 'Fitness enthusiast and gym regular', 'Book lover and coffee addict', 'Music lover and concert goer', 'Photography enthusiast', 'Cooking is my passion', 'Adventure seeker and thrill lover', 'Homebody who loves movies', 'Gym rat and fitness coach', 'Entrepreneur and business minded', 'Dog lover and animal advocate', 'Beach person and water sports fan', 'Wine tasting enthusiast', 'Volunteer and community helper', 'Gaming and tech enthusiast', 'Dancer and performer'];
const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston'];
const avatars = ['https://i.pravatar.cc/150?img=1', 'https://i.pravatar.cc/150?img=2', 'https://i.pravatar.cc/150?img=3', 'https://i.pravatar.cc/150?img=4', 'https://i.pravatar.cc/150?img=5', 'https://i.pravatar.cc/150?img=6', 'https://i.pravatar.cc/150?img=7', 'https://i.pravatar.cc/150?img=8', 'https://i.pravatar.cc/150?img=9', 'https://i.pravatar.cc/150?img=10', 'https://i.pravatar.cc/150?img=11', 'https://i.pravatar.cc/150?img=12', 'https://i.pravatar.cc/150?img=13', 'https://i.pravatar.cc/150?img=14', 'https://i.pravatar.cc/150?img=15', 'https://i.pravatar.cc/150?img=16', 'https://i.pravatar.cc/150?img=17', 'https://i.pravatar.cc/150?img=18', 'https://i.pravatar.cc/150?img=19', 'https://i.pravatar.cc/150?img=20'];

const answers = [
  { q1: 'Dinner', q2: ['Trust'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Weekend trips'], q8: ['Casual'], q9: ['Yes'], q10: ['Honesty'], q11: ['Active'], q12: 'Yes', q13: 'Humor', q14: ['Ambitious'], q15: ['Sports'], q16: 'Success through growth', q17: 'Failure', q18: ['Very important'], q19: 'Someone kind and genuine', q20: 'Live fully' },
  { q1: 'Movie', q2: ['Communication'], q3: ['No'], q4: 'Planned', q5: ['Introvert'], q6: 'No', q7: ['Cozy nights'], q8: ['Serious'], q9: ['No'], q10: ['Loyalty'], q11: ['Relaxed'], q12: 'No', q13: 'Intelligence', q14: ['Creative'], q15: ['Reading'], q16: 'Making a difference', q17: 'Loneliness', q18: ['Important'], q19: 'Someone thoughtful', q20: 'Quality over quantity' },
  { q1: 'Outdoor activity', q2: ['Humor'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Adventure travel'], q8: ['Casual'], q9: ['Yes'], q10: ['Ambition'], q11: ['Very active'], q12: 'Yes', q13: 'Kindness', q14: ['Driven'], q15: ['Travel'], q16: 'Living adventures', q17: 'Stagnation', q18: ['Very important'], q19: 'Someone adventurous', q20: 'Carpe diem' },
  { q1: 'Coffee', q2: ['Attraction'], q3: ['Yes'], q4: 'Planned', q5: ['Ambivert'], q6: 'Yes', q7: ['Cultural events'], q8: ['Casual'], q9: ['Yes'], q10: ['Respect'], q11: ['Moderate'], q12: 'Yes', q13: 'Authenticity', q14: ['Thoughtful'], q15: ['Art/Music'], q16: 'Creative expression', q17: 'Losing passion', q18: ['Somewhat important'], q19: 'Someone artistic', q20: 'Create beauty' },
  { q1: 'Dinner', q2: ['Trust'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Beach trips'], q8: ['Casual'], q9: ['Yes'], q10: ['Honesty'], q11: ['Very active'], q12: 'Yes', q13: 'Humor', q14: ['Ambitious'], q15: ['Sports'], q16: 'Health and fitness', q17: 'Illness', q18: ['Very important'], q19: 'Someone fit', q20: 'Stay healthy' },
  { q1: 'Movie', q2: ['Communication'], q3: ['No'], q4: 'Planned', q5: ['Introvert'], q6: 'No', q7: ['Quiet time'], q8: ['Serious'], q9: ['No'], q10: ['Loyalty'], q11: ['Relaxed'], q12: 'No', q13: 'Intelligence', q14: ['Intellectual'], q15: ['Reading'], q16: 'Knowledge and wisdom', q17: 'Ignorance', q18: ['Important'], q19: 'Someone intelligent', q20: 'Never stop learning' },
  { q1: 'Outdoor activity', q2: ['Humor'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Music festivals'], q8: ['Casual'], q9: ['Yes'], q10: ['Ambition'], q11: ['Very active'], q12: 'Yes', q13: 'Kindness', q14: ['Passionate'], q15: ['Art/Music'], q16: 'Sharing joy', q17: 'Silence', q18: ['Somewhat important'], q19: 'Someone musical', q20: 'Make memories' },
  { q1: 'Coffee', q2: ['Attraction'], q3: ['Yes'], q4: 'Planned', q5: ['Ambivert'], q6: 'Yes', q7: ['Photography walks'], q8: ['Casual'], q9: ['Yes'], q10: ['Respect'], q11: ['Moderate'], q12: 'Yes', q13: 'Authenticity', q14: ['Creative'], q15: ['Art/Music'], q16: 'Capturing moments', q17: 'Losing creativity', q18: ['Somewhat important'], q19: 'Someone creative', q20: 'See beauty' },
  { q1: 'Dinner', q2: ['Trust'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Cooking classes'], q8: ['Casual'], q9: ['Yes'], q10: ['Honesty'], q11: ['Moderate'], q12: 'Yes', q13: 'Humor', q14: ['Ambitious'], q15: ['Cooking'], q16: 'Culinary mastery', q17: 'Bad food', q18: ['Important'], q19: 'Someone who cooks', q20: 'Enjoy good meals' },
  { q1: 'Movie', q2: ['Communication'], q3: ['No'], q4: 'Planned', q5: ['Introvert'], q6: 'No', q7: ['Quiet time'], q8: ['Serious'], q9: ['No'], q10: ['Loyalty'], q11: ['Relaxed'], q12: 'No', q13: 'Intelligence', q14: ['Thoughtful'], q15: ['Reading'], q16: 'Inner peace', q17: 'Chaos', q18: ['Important'], q19: 'Someone calm', q20: 'Find peace' },
  { q1: 'Outdoor activity', q2: ['Humor'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Adventure travel'], q8: ['Casual'], q9: ['Yes'], q10: ['Ambition'], q11: ['Very active'], q12: 'Yes', q13: 'Kindness', q14: ['Driven'], q15: ['Travel'], q16: 'Exploring the world', q17: 'Staying put', q18: ['Very important'], q19: 'Someone adventurous', q20: 'Explore everywhere' },
  { q1: 'Coffee', q2: ['Attraction'], q3: ['Yes'], q4: 'Planned', q5: ['Ambivert'], q6: 'Yes', q7: ['Tech meetups'], q8: ['Casual'], q9: ['Yes'], q10: ['Respect'], q11: ['Moderate'], q12: 'Yes', q13: 'Authenticity', q14: ['Innovative'], q15: ['Gaming'], q16: 'Innovation', q17: 'Obsolescence', q18: ['Very important'], q19: 'Someone tech-savvy', q20: 'Build the future' },
  { q1: 'Dinner', q2: ['Trust'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Business networking'], q8: ['Serious'], q9: ['Yes'], q10: ['Honesty'], q11: ['Active'], q12: 'Yes', q13: 'Humor', q14: ['Ambitious'], q15: ['Sports'], q16: 'Business success', q17: 'Failure', q18: ['Very important'], q19: 'Someone ambitious', q20: 'Achieve greatness' },
  { q1: 'Movie', q2: ['Communication'], q3: ['No'], q4: 'Planned', q5: ['Introvert'], q6: 'No', q7: ['Quiet time'], q8: ['Serious'], q9: ['No'], q10: ['Loyalty'], q11: ['Relaxed'], q12: 'No', q13: 'Intelligence', q14: ['Artistic'], q15: ['Art/Music'], q16: 'Artistic expression', q17: 'Conformity', q18: ['Not important'], q19: 'Someone artistic', q20: 'Express myself' },
  { q1: 'Outdoor activity', q2: ['Humor'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Animal rescue'], q8: ['Casual'], q9: ['Yes'], q10: ['Ambition'], q11: ['Very active'], q12: 'Yes', q13: 'Kindness', q14: ['Compassionate'], q15: ['Sports'], q16: 'Helping others', q17: 'Indifference', q18: ['Somewhat important'], q19: 'Someone caring', q20: 'Make a difference' },
  { q1: 'Coffee', q2: ['Attraction'], q3: ['Yes'], q4: 'Planned', q5: ['Ambivert'], q6: 'Yes', q7: ['Beach days'], q8: ['Casual'], q9: ['Yes'], q10: ['Respect'], q11: ['Moderate'], q12: 'Yes', q13: 'Authenticity', q14: ['Laid-back'], q15: ['Travel'], q16: 'Enjoying life', q17: 'Stress', q18: ['Somewhat important'], q19: 'Someone relaxed', q20: 'Go with the flow' },
  { q1: 'Dinner', q2: ['Trust'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Wine tasting'], q8: ['Casual'], q9: ['Yes'], q10: ['Honesty'], q11: ['Moderate'], q12: 'Yes', q13: 'Humor', q14: ['Sophisticated'], q15: ['Cooking'], q16: 'Refined living', q17: 'Vulgarity', q18: ['Very important'], q19: 'Someone cultured', q20: 'Live elegantly' },
  { q1: 'Movie', q2: ['Communication'], q3: ['No'], q4: 'Planned', q5: ['Introvert'], q6: 'No', q7: ['Volunteering'], q8: ['Serious'], q9: ['No'], q10: ['Loyalty'], q11: ['Relaxed'], q12: 'No', q13: 'Intelligence', q14: ['Altruistic'], q15: ['Sports'], q16: 'Serving humanity', q17: 'Selfishness', q18: ['Not important'], q19: 'Someone giving', q20: 'Give back' },
  { q1: 'Outdoor activity', q2: ['Humor'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Dance clubs'], q8: ['Casual'], q9: ['Yes'], q10: ['Ambition'], q11: ['Very active'], q12: 'Yes', q13: 'Kindness', q14: ['Energetic'], q15: ['Art/Music'], q16: 'Living in the moment', q17: 'Boredom', q18: ['Somewhat important'], q19: 'Someone fun', q20: 'Have fun always' }
];

async function main() {
  console.log('Starting full seed...');
  
  for (let i = 1; i <= 20; i++) {
    try {
      const password = await bcrypt.hash('password123', 10);
      const tier = i === 1 ? 'premium' : i === 2 ? 'vip' : 'free';
      
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
          tier
        }
      });
      
      await prisma.questionnaire.create({
        data: {
          userId: user.id,
          answers: JSON.stringify(answers[i - 1])
        }
      });
      
      console.log(`Created user${i} and questionnaire`);
    } catch (err) {
      console.log(`Error with user${i}:`, err.message);
    }
  }
  
  console.log('Full seed completed!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
