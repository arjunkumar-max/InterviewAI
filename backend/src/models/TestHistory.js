import mongoose from 'mongoose';

const testHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    role: {
      type: String,
      required: true, // e.g., "Frontend Developer", "HR"
    },
    score: {
      type: Number,
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
    interviewType: {
      type: String,
      default: 'TECHNICAL', // or 'HR'
    }
  },
  { timestamps: true }
);

export default mongoose.model('TestHistory', testHistorySchema);