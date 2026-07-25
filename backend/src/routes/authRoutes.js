import express from 'express';
import { registerUser, loginUser, verifyOtp, sendForgotOtp, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/forgot-password/send-otp', sendForgotOtp);
router.post('/forgot-password/reset', resetPassword);

export default router;