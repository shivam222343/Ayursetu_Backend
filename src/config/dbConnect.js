const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://dombeshivam80_db_user:AyurSetu@cluster0.5a6ny7q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log(`Database connected: ${connect.connection.host}`);
  } catch (err) {
    console.error("DB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = dbConnect;
