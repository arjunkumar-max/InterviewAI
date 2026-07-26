import express from 'express';
import { registerUser, loginUser, verifyOtp, sendForgotOtp, resetPassword, googleLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/forgot-password/send-otp', sendForgotOtp);
router.post('/forgot-password/reset', resetPassword);
router.post('/google-login', googleLogin);

export default router;
