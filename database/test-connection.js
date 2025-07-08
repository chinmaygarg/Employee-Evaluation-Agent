const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const testConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-exam-system';
    console.log('Testing connection to:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected successfully!');
    
    // Simple test operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Try to create a simple document
    const testSchema = new mongoose.Schema({ test: String });
    const Test = mongoose.model('Test', testSchema);
    
    const doc = new Test({ test: 'Hello World' });
    await doc.save();
    console.log('✅ Test document created successfully!');
    
    await mongoose.connection.collection('tests').deleteMany({});
    console.log('✅ Test document cleaned up');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

testConnection();
