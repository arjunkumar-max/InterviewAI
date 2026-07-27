import mongoose from 'mongoose';

export const connectDB = async () => {
  // 1. Agar pehle se connected hai, toh wahi use karo (Vercel Fix)
  // testing my new mongodb connection
  if (mongoose.connection.readyState >= 1) {
    console.log("MongoDB is already connected.");
    return;
  }

  // 2. Naya connection banao
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // DHYAAN DE: Maine yahan se process.exit(1) hata diya hai!
  }
};
