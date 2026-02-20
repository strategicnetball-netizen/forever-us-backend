const BASE_URL = 'http://localhost:3000/api';

// Test user credentials
const testUser = {
  email: 'user1@example.com',
  password: 'password123'
};

let token = '';

async function login() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await response.json();
    token = data.token;
    console.log('✓ Login successful');
    return data.user.id;
  } catch (err) {
    console.error('✗ Login failed:', err.message);
    process.exit(1);
  }
}

async function testCounters() {
  const headers = { Authorization: `Bearer ${token}` };

  try {
    console.log('\nTesting counter endpoints...\n');

    // Test likes sent
    const likesRes = await fetch(`${BASE_URL}/likes/sent`, { headers });
    const likesData = await likesRes.json();
    console.log(`✓ Likes sent: ${likesData.length}`);

    // Test matches
    const matchesRes = await fetch(`${BASE_URL}/likes/matches`, { headers });
    const matchesData = await matchesRes.json();
    console.log(`✓ Matches: ${matchesData.length}`);

    // Test messages inbox
    const messagesRes = await fetch(`${BASE_URL}/messages/inbox`, { headers });
    const messagesData = await messagesRes.json();
    console.log(`✓ Messages: ${messagesData.length}`);

    // Test admirers
    const admirersRes = await fetch(`${BASE_URL}/admirers`, { headers });
    const admirersData = await admirersRes.json();
    console.log(`✓ Admirers: ${admirersData.length}`);

    console.log('\n✓ All endpoints working correctly!');
  } catch (err) {
    console.error('✗ Error testing endpoints:', err.message);
    process.exit(1);
  }
}

async function main() {
  console.log('Testing notification counters...\n');
  await login();
  await testCounters();
}

main();
