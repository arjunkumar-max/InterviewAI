import express from 'express';
import { getTestHistory, saveTestResult } from '../controllers/testController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply 'protect' middleware to all routes in this file
router.use(protect); 

router.route('/')
  .get(getTestHistory)
  .post(saveTestResult);

export default router;