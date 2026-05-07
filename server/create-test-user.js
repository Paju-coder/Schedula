require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createTestUser = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!');

    const email = 'test@example.com';
    const slug = 'test-user';

    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email }, { slug }] });
    if (existing) {
      console.log('⚠️ Test user already exists!');
      process.exit(0);
    }

    console.log('👤 Creating test user...');
    await User.create({
      name: 'Test User',
      email: email,
      password: 'password123',
      slug: slug,
      phone: '+917498453394',
      bio: 'I am a test user for the Schedula Hackathon demo!'
    });

    console.log('🚀 SUCCESS! Test user created.');
    console.log('---------------------------');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('Link: http://localhost:5173/test-user');
    console.log('---------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating user:', err.message);
    process.exit(1);
  }
};

createTestUser();
