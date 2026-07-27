import mongoose from 'mongoose';

// Vercel container mein state save rakhne ke liye global variable
let isConnected = false; 

export const connectDB = async () => {
  // 1. Agar sach mein connected hai, toh purana connection use karo
  if (isConnected) {
    console.log("=> Using existing database connection");
    return;
  }

  // 2. Naya connection banao
  try {
    console.log("=> Connecting to MongoDB...");
    const db = await mongoose.connect(process.env.MONGO_URI, {
      // Yeh line sabse zaroori hai Vercel ke liye! Buffering timeout rokne ke liye.
      serverSelectionTimeoutMS: 5000, 
    });

    // Connection successful hone par state update kar do
    isConnected = db.connections[0].readyState === 1;
    console.log(`=> MongoDB Connected: ${db.connection.host}`);
    
  } catch (error) {
    console.log(`=> Database connection error: ${error.message}`);
  }
};
