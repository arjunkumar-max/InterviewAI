import express from 'express';
import { processTechnicalBatch, processHrBatch, generateHr } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/technical', processTechnicalBatch);
router.post('/hr', processHrBatch);
router.post('/hr/generate', generateHr);

export default router;