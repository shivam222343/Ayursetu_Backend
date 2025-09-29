const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for migration');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateFeedbackField = async () => {
  try {
    await connectDB();
    
    // Update all existing appointments to have feedbackSubmitted: false
    const result = await mongoose.connection.db.collection('appointments').updateMany(
      { feedbackSubmitted: { $exists: false } },
      { $set: { feedbackSubmitted: false } }
    );
    
    console.log(`Migration completed. Updated ${result.modifiedCount} appointments.`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateFeedbackField();