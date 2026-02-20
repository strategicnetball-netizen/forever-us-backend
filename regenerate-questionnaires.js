import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const QUESTIONS = [
  { text: "What's your ideal first date?", type: "text" },
  { text: "What's your biggest life goal?", type: "dropdown", options: ["Career success", "Family", "Travel", "Financial security", "Personal growth", "Helping others", "Other"] },
  { text: "How do you spend your weekends?", type: "dropdown", options: ["Outdoors/Adventure", "With friends/family", "Relaxing at home", "Hobbies/Creative", "Sports/Fitness", "Socializing", "Other"] },
  { text: "What's your favorite travel destination?", type: "text" },
  { text: "What's your relationship with your family like?", type: "dropdown", options: ["Very close", "Close", "Moderate", "Distant", "Complicated", "Other"] },
  { text: "What's your career ambition?", type: "text" },
  { text: "How important is fitness to you?", type: "dropdown", options: ["Very important", "Important", "Somewhat important", "Not very important", "Not important"] },
  { text: "What's your favorite type of cuisine?", type: "dropdown", options: ["Italian", "Asian", "Mexican", "Mediterranean", "American", "Indian", "Other"] },
  { text: "Do you want kids in the future?", type: "dropdown", options: ["Yes, definitely", "Maybe", "Undecided", "No", "Already have kids"] },
  { text: "What's your love language?", type: "dropdown", options: ["Words of affirmation", "Acts of service", "Receiving gifts", "Quality time", "Physical touch"] },
  { text: "How do you handle conflict?", type: "dropdown", options: ["Direct communication", "Take time to cool off", "Seek compromise", "Avoid confrontation", "Other"] },
  { text: "What's your ideal vacation?", type: "dropdown", options: ["Beach/Resort", "Mountain/Hiking", "City exploration", "Adventure travel", "Cultural tour", "Staycation"] },
  { text: "What's your biggest pet peeve?", type: "text" },
  { text: "How important is religion/spirituality?", type: "dropdown", options: ["Very important", "Important", "Somewhat important", "Not important", "Prefer not to say"] },
  { text: "What's your favorite hobby?", type: "dropdown", options: ["Sports", "Reading", "Gaming", "Art/Music", "Cooking", "Travel", "Other"] },
  { text: "How do you define success?", type: "text" },
  { text: "What's your biggest fear?", type: "text" },
  { text: "How important is financial stability?", type: "dropdown", options: ["Very important", "Important", "Somewhat important", "Not very important", "Not important"] },
  { text: "What's your ideal partner's personality?", type: "text" },
  { text: "What's your life motto?", type: "text" }
];

// Generate proper answers for each user
const answerSets = [
  {
    q1: "Dinner at a nice restaurant",
    q2: ["Career success"],
    q3: ["Outdoors/Adventure"],
    q4: "Paris",
    q5: ["Very close"],
    q6: "Building my own business",
    q7: ["Very important"],
    q8: ["Italian"],
    q9: ["Yes, definitely"],
    q10: ["Quality time"],
    q11: ["Direct communication"],
    q12: ["Beach/Resort"],
    q13: "Dishonesty",
    q14: ["Very important"],
    q15: ["Sports"],
    q16: "Achieving my goals",
    q17: "Failure",
    q18: ["Very important"],
    q19: "Someone ambitious and kind",
    q20: "Live fully"
  },
  {
    q1: "Movie night",
    q2: ["Family"],
    q3: ["Relaxing at home"],
    q4: "Tokyo",
    q5: ["Close"],
    q6: "Helping others",
    q7: ["Important"],
    q8: ["Asian"],
    q9: ["Maybe"],
    q10: ["Words of affirmation"],
    q11: ["Take time to cool off"],
    q12: ["Mountain/Hiking"],
    q13: "Rudeness",
    q14: ["Important"],
    q15: ["Reading"],
    q16: "Making a difference",
    q17: "Loneliness",
    q18: ["Important"],
    q19: "Someone thoughtful",
    q20: "Quality over quantity"
  },
  {
    q1: "Outdoor adventure",
    q2: ["Travel"],
    q3: ["Outdoors/Adventure"],
    q4: "New Zealand",
    q5: ["Moderate"],
    q6: "Traveling the world",
    q7: ["Very important"],
    q8: ["Mexican"],
    q9: ["Yes, definitely"],
    q10: ["Acts of service"],
    q11: ["Seek compromise"],
    q12: ["Adventure travel"],
    q13: "Laziness",
    q14: ["Somewhat important"],
    q15: ["Travel"],
    q16: "Exploring new places",
    q17: "Stagnation",
    q18: ["Somewhat important"],
    q19: "Someone adventurous",
    q20: "Carpe diem"
  },
  {
    q1: "Coffee date",
    q2: ["Personal growth"],
    q3: ["Hobbies/Creative"],
    q4: "Barcelona",
    q5: ["Distant"],
    q6: "Creative pursuits",
    q7: ["Somewhat important"],
    q8: ["Mediterranean"],
    q9: ["Undecided"],
    q10: ["Receiving gifts"],
    q11: ["Avoid confrontation"],
    q12: ["Cultural tour"],
    q13: "Negativity",
    q14: ["Important"],
    q15: ["Art/Music"],
    q16: "Creative expression",
    q17: "Losing passion",
    q18: ["Somewhat important"],
    q19: "Someone artistic",
    q20: "Create beauty"
  },
  {
    q1: "Beach day",
    q2: ["Financial security"],
    q3: ["Sports/Fitness"],
    q4: "Bali",
    q5: ["Very close"],
    q6: "Financial independence",
    q7: ["Very important"],
    q8: ["American"],
    q9: ["Yes, definitely"],
    q10: ["Physical touch"],
    q11: ["Direct communication"],
    q12: ["Beach/Resort"],
    q13: "Dishonesty",
    q14: ["Very important"],
    q15: ["Sports"],
    q16: "Health and fitness",
    q17: "Illness",
    q18: ["Very important"],
    q19: "Someone fit and healthy",
    q20: "Stay healthy"
  }
];

async function regenerateQuestionnaires() {
  try {
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${users.length} users`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const answerSetIndex = i % answerSets.length;
      const answers = answerSets[answerSetIndex];

      try {
        await prisma.questionnaire.upsert({
          where: { userId: user.id },
          update: { answers: JSON.stringify(answers) },
          create: {
            userId: user.id,
            answers: JSON.stringify(answers)
          }
        });
        console.log(`✓ Updated ${user.email} with answer set ${answerSetIndex}`);
      } catch (err) {
        console.log(`✗ Error updating ${user.email}:`, err.message);
      }
    }

    console.log('✓ Done regenerating questionnaires!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateQuestionnaires();
