import axios from 'axios';

const API_BASE = 'http://localhost:3002/api';
let token = '';
let userId = '';

async function test() {
  try {
    console.log('🧪 Testing Red Flags & Deal Breakers Implementation\n');

    // 1. Login as test user
    console.log('1️⃣ Logging in as test user...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'user1@example.com',
      password: 'password123'
    });
    token = loginRes.data.token;
    userId = loginRes.data.user.id;
    console.log('✅ Logged in successfully');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   User ID: ${userId}\n`);

    // 2. Get available questionnaires
    console.log('2️⃣ Getting available questionnaires...');
    const availRes = await axios.get(`${API_BASE}/optional-questionnaires/available`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const redFlagsQ = availRes.data.questionnaires.find(q => q.type === 'red_flags');
    const dealBreakersQ = availRes.data.questionnaires.find(q => q.type === 'deal_breakers');
    console.log('✅ Questionnaires retrieved');
    console.log(`   Red Flags: ${redFlagsQ.title} (${redFlagsQ.questions} questions, ${redFlagsQ.coinsReward} coins)`);
    console.log(`   Deal Breakers: ${dealBreakersQ.title} (${dealBreakersQ.questions} questions, ${dealBreakersQ.coinsReward} coins)\n`);

    // 3. Get red flags questions
    console.log('3️⃣ Getting red flags questions...');
    const redFlagsQRes = await axios.get(`${API_BASE}/optional-questionnaires/red_flags`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Red flags questions retrieved');
    console.log(`   Total questions: ${redFlagsQRes.data.totalQuestions}`);
    console.log(`   Question 1 type: ${redFlagsQRes.data.questions[0].type}`);
    console.log(`   Question 2 type: ${redFlagsQRes.data.questions[1].type}`);
    console.log(`   Question 2 options count: ${redFlagsQRes.data.questions[1].options.length}\n`);

    // 4. Get deal breakers questions
    console.log('4️⃣ Getting deal breakers questions...');
    const dealBreakersQRes = await axios.get(`${API_BASE}/optional-questionnaires/deal_breakers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Deal breakers questions retrieved');
    console.log(`   Total questions: ${dealBreakersQRes.data.totalQuestions}`);
    console.log(`   Question 1 type: ${dealBreakersQRes.data.questions[0].type}`);
    console.log(`   Question 2 type: ${dealBreakersQRes.data.questions[1].type}`);
    console.log(`   Question 2 options count: ${dealBreakersQRes.data.questions[1].options.length}\n`);

    // 5. Get red flags list
    console.log('5️⃣ Getting red flags list...');
    const redFlagsListRes = await axios.get(`${API_BASE}/optional-questionnaires/lists/red-flags`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Red flags list retrieved');
    console.log(`   Total flags: ${redFlagsListRes.data.flags.length}`);
    console.log(`   Sample flags: ${redFlagsListRes.data.flags.slice(0, 3).join(', ')}\n`);

    // 6. Get deal breakers list
    console.log('6️⃣ Getting deal breakers list...');
    const dealBreakersListRes = await axios.get(`${API_BASE}/optional-questionnaires/lists/deal-breakers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Deal breakers list retrieved');
    console.log(`   Total breakers: ${dealBreakersListRes.data.breakers.length}`);
    console.log(`   Sample breakers: ${dealBreakersListRes.data.breakers.slice(0, 3).join(', ')}\n`);

    // 7. Submit red flags questionnaire
    console.log('7️⃣ Submitting red flags questionnaire...');
    const redFlagsSubmit = await axios.post(
      `${API_BASE}/optional-questionnaires/red_flags/submit`,
      {
        answers: {
          rawInput: 'Poor communication, dishonesty, lack of ambition',
          selectedFlags: ['Poor communication', 'Dishonesty', 'Lack of ambition']
        }
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Red flags submitted');
    console.log(`   Message: ${redFlagsSubmit.data.message}`);
    console.log(`   Coins earned: ${redFlagsSubmit.data.coinsEarned}`);
    console.log(`   Total points: ${redFlagsSubmit.data.totalPoints}\n`);

    // 8. Submit deal breakers questionnaire
    console.log('8️⃣ Submitting deal breakers questionnaire...');
    const dealBreakersSubmit = await axios.post(
      `${API_BASE}/optional-questionnaires/deal_breakers/submit`,
      {
        answers: {
          rawInput: 'Wants children, smoker, unemployed',
          selectedBreakers: ['Wants children', 'Smoker', 'Unemployed']
        }
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Deal breakers submitted');
    console.log(`   Message: ${dealBreakersSubmit.data.message}`);
    console.log(`   Coins earned: ${dealBreakersSubmit.data.coinsEarned}`);
    console.log(`   Total points: ${dealBreakersSubmit.data.totalPoints}\n`);

    // 9. Get red flags answers
    console.log('9️⃣ Getting red flags answers...');
    const redFlagsAnswers = await axios.get(`${API_BASE}/optional-questionnaires/red_flags/answers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Red flags answers retrieved');
    console.log(`   Raw input: ${redFlagsAnswers.data.answers.rawInput}`);
    console.log(`   Selected flags: ${redFlagsAnswers.data.answers.selectedFlags.join(', ')}\n`);

    // 10. Get deal breakers answers
    console.log('🔟 Getting deal breakers answers...');
    const dealBreakersAnswers = await axios.get(`${API_BASE}/optional-questionnaires/deal_breakers/answers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Deal breakers answers retrieved');
    console.log(`   Raw input: ${dealBreakersAnswers.data.answers.rawInput}`);
    console.log(`   Selected breakers: ${dealBreakersAnswers.data.answers.selectedBreakers.join(', ')}\n`);

    console.log('✅ All tests passed!');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

test();
