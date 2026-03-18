const API_URL = 'http://localhost:3001/api';

async function registerTestUser() {
  try {
    console.log('Registering test user...');
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123',
        name: 'Admin User',
        age: 30
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ User registered successfully!');
      console.log('Email:', data.user.email);
      console.log('\nYou can now login with:');
      console.log('Email: admin@admin.com');
      console.log('Password: admin123');
    } else {
      console.log('✓ User already exists or error:', data.error);
      console.log('Email: admin@admin.com');
      console.log('Password: admin123');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

registerTestUser();
