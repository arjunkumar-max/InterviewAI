import express from 'express';
import multer from 'multer';
import { uploadResume } from '../controllers/resumeController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Store file in memory to parse it immediately
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', protect, upload.single('file'), uploadResume);

export default router;