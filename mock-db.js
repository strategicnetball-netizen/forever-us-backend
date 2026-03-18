// Simple in-memory mock database for local testing
import bcrypt from 'bcryptjs';

const mockDB = {
  users: [],
  questionnaires: [],
  
  async init() {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    this.users.push({
      id: '1',
      email: 'admin@admin.com',
      password: adminPassword,
      name: 'Admin User',
      age: 30,
      gender: 'other',
      city: 'Admin City',
      country: 'US',
      bio: 'Admin account for testing',
      points: 1000,
      tier: 'premium',
      isAdmin: true,
      profileCompleted: true
    });
    
    // Create test users
    const testUsers = [
      { email: 'user1@example.com', name: 'Sarah', gender: 'female', tier: 'premium' },
      { email: 'user2@example.com', name: 'Emma', gender: 'female', tier: 'vip' },
      { email: 'user3@example.com', name: 'Jessica', gender: 'female', tier: 'free' },
      { email: 'user4@example.com', name: 'David', gender: 'male', tier: 'free' },
      { email: 'user5@example.com', name: 'James', gender: 'male', tier: 'free' }
    ];
    
    for (let i = 0; i < testUsers.length; i++) {
      const password = await bcrypt.hash('password123', 10);
      this.users.push({
        id: String(i + 2),
        ...testUsers[i],
        password,
        age: 22 + i,
        city: 'Test City',
        country: 'US',
        bio: `I'm ${testUsers[i].name}`,
        points: 50,
        isAdmin: false,
        profileCompleted: true
      });
    }
    
    console.log('✓ Mock database initialized with', this.users.length, 'users');
  },
  
  findUserByEmail(email) {
    return this.users.find(u => u.email === email);
  },
  
  findUserById(id) {
    return this.users.find(u => u.id === id);
  },
  
  createUser(data) {
    const user = {
      id: String(this.users.length + 1),
      ...data
    };
    this.users.push(user);
    return user;
  },
  
  updateUser(id, data) {
    const user = this.findUserById(id);
    if (user) {
      Object.assign(user, data);
    }
    return user;
  }
};

export default mockDB;
