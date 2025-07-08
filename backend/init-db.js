const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/user.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for initialization');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const initializeDatabase = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: process.env.DEFAULT_ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const adminUser = new User({
      name: 'Admin User',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
      role: 'admin',
    });

    await adminUser.save();
    console.log(`Default admin user created with email: ${adminUser.email}`);
    console.log(`Default password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'}`);
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

const main = async () => {
  await connectDB();
  await initializeDatabase();
  mongoose.connection.close();
  console.log('Database initialization complete');
};

main().catch(console.error);
