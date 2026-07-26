import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// 1. ADDED ROOT ROUTE: Prevents 404 on the main Vercel URL
app.get("/", (req, res) => {
  res.send("Backend API is running live!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/resume", resumeRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "API is running successfully" });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;