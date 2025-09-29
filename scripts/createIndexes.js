const mongoose = require('mongoose');
require('dotenv').config();

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://dombeshivam80_db_user:AyurSetu@cluster0.5a6ny7q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Create unique index for appointments to prevent double booking
    await db.collection('appointments').createIndex(
      { practitionerId: 1, startTime: 1 },
      { unique: true }
    );
    
    console.log('Appointment indexes created successfully');
    
    // Additional useful indexes
    await db.collection('appointments').createIndex({ patientId: 1 });
    await db.collection('appointments').createIndex({ status: 1 });
    await db.collection('appointments').createIndex({ createdAt: -1 });
    
    console.log('Additional indexes created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
};

createIndexes();