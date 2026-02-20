async function testLikeFlow() {
  console.log('=== Comprehensive Like Endpoint Test ===\n');
  
  // Step 1: Register a test user
  console.log('Step 1: Register test user');
  try {
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User'
      })
    });
    const registerData = await registerResponse.json();
    console.log('Status:', registerResponse.status);
    console.log('Response:', JSON.stringify(registerData, null, 2));
    
    if (!registerResponse.ok) {
      console.log('Registration failed!');
      return;
    }
    
    const token = registerData.token;
    const userId = registerData.user.id;
    console.log(' User registered with ID:', userId);
    console.log(' Token:', token.substring(0, 20) + '...\n');
    
    // Step 2: Register another user to like
    console.log('Step 2: Register another user to like');
    const register2Response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now() + 1}@example.com`,
        password: 'password123',
        name: 'Target User'
      })
    });
    const register2Data = await register2Response.json();
    const targetUserId = register2Data.user.id;
    console.log(' Target user registered with ID:', targetUserId, '\n');
    
    // Step 3: Try to like the target user
    console.log('Step 3: Like target user');
    const likeResponse = await fetch(`http://localhost:3000/api/likes/${targetUserId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: '{}'
    });
    const likeData = await likeResponse.json();
    console.log('Status:', likeResponse.status);
    console.log('Response:', JSON.stringify(likeData, null, 2));
    
    if (likeResponse.ok) {
      console.log(' Like successful!');
    } else {
      console.log(' Like failed with error:', likeData.error);
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testLikeFlow().catch(console.error);
