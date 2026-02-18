// server/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Debugging ke liye check:
    if (!process.env.MONGO_URI) {
      console.error("ERROR: MONGO_URI is not defined in .env file!");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;