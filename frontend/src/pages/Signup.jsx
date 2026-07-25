import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const Signup = () => {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email ya Phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 NEW STATES FOR OTP MODAL
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const navigate = useNavigate();

  const validateInput = (input) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    return gmailRegex.test(input) || phoneRegex.test(input);
  };

  // =========================================================================
  // 1️⃣ STEP 1: SIGNUP & SEND OTP
  // =========================================================================
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateInput(identifier)) {
      setError("❌ Registration allowed only with '@gmail.com' or a 10-digit Indian phone number!");
      return;
    }

    if (password.length < 6) {
      setError("❌ Password must be at least 6 characters long!");
      return;
    }

    setLoading(true);
    try {
      // Changed to use environment variable
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, {
        name: name,
        email: identifier,
        password: password
      });

      // 🔥 Success! Form hide mat karo, upar se OTP Modal open kar do
      setShowOtpModal(true);
      alert("📧 6-digit verification code sent to your Gmail/Phone!");
    } catch (err) {
      setError(err.response?.data?.body || err.response?.data || "❌ Signup failed. This email/phone might already exist!");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 2️⃣ STEP 2: VERIFY OTP & LOGIN AUTOMATICALLY
  // =========================================================================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (enteredOtp.length !== 6) {
      setOtpError("❌ Please enter a valid 6-digit OTP!");
      return;
    }

    setOtpLoading(true);
    try {
      // Changed to use environment variable
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`, {
        email: identifier,
        otp: enteredOtp
      });

      // 🔥 Token save karo aur direct Dashboard par bhejo!
      localStorage.setItem('token', res.data.token);
      alert("🎉 Account Verified Successfully! Welcome to InterviewAI.");
      navigate('/dashboard');
    } catch (err) {
      setOtpError(err.response?.data || "❌ Invalid OTP! Please check your email again.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative">

      {/* ===================================================================== */}
      {/* 🔮 MAIN SIGNUP FORM */}
      {/* ===================================================================== */}
      <div className="max-w-md w-full bg-[#141414] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden z-10">

        {/* Glow Effect */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <h2 className="text-3xl font-extrabold text-white text-center mb-2">Create Account 🚀</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Join InterviewAI and crack your dream placement</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-xl mb-4 text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              disabled={showOtpModal}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Gmail or Phone Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="example@gmail.com or 98*********"
              required
              disabled={showOtpModal}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              disabled={showOtpModal}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-white transition text-sm cursor-pointer"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || showOtpModal}
            className="w-full bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-blue-500/20 cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? "Sending Verification Code..." : "Signup Now ✨"}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline font-bold">
            Login
          </Link>
        </p>
        {/* ========================================================= */}
        {/* 🔥 GOOGLE ONE-TAP SIGNUP SECTION */}
        {/* ========================================================= */}
        <div className="my-6 flex items-center justify-between">
          <span className="w-1/5 border-b border-gray-700"></span>
          <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">
            Or Continue With
          </span>
          <span className="w-1/5 border-b border-gray-700"></span>
        </div>

        <div className="flex justify-center mb-4">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const decoded = jwtDecode(credentialResponse.credential);
                console.log("🌐 Google User Info:", decoded);

                // Changed to use environment variable
                const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/google-login`, {
                  email: decoded.email,
                  name: decoded.name,
                  picture: decoded.picture
                });

                localStorage.setItem('token', res.data.token);
                alert(`🎉 Account Created! Welcome ${decoded.name}!`);
                navigate('/dashboard');
              } catch (err) {
                console.error("Backend Google Auth Error:", err);
                setError("❌ Google Signup failed on server! Please try again.");
              }
            }}
            onError={() => {
              setError("❌ Google Signup Popup Failed!");
            }}
            theme="filled_black"
            shape="pill"
            size="large"
            width="350"
            text="continue_with"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🛡️ PRO GLASSMORPHISM OTP MODAL (Pops up when showOtpModal is TRUE) */}
      {/* ===================================================================== */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center px-4 z-50 animate-fadeIn">
          <div className="max-w-sm w-full bg-[#181818] border border-blue-500/40 rounded-2xl p-6 shadow-2xl relative text-center">

            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
              📧
            </div>

            <h3 className="text-xl font-extrabold text-white mb-1">Verify Your Email</h3>
            <p className="text-gray-400 text-xs mb-6">
              We've sent a 6-digit verification code to <span className="text-blue-400 font-bold">{identifier}</span>
            </p>

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-2.5 rounded-xl mb-4 text-center">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                maxLength="6"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="• • • • • •"
                autoFocus
                className="w-full bg-[#242424] border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-black placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
              />

              <button
                type="submit"
                disabled={otpLoading || enteredOtp.length !== 6}
                className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-extrabold py-3 rounded-xl transition shadow-lg shadow-green-500/20 cursor-pointer disabled:opacity-50"
              >
                {otpLoading ? "Verifying..." : "Verify & Login 🚀"}
              </button>
            </form>

            <button
              onClick={() => setShowOtpModal(false)}
              className="mt-4 text-xs text-gray-500 hover:text-gray-300 underline cursor-pointer"
            >
              Entered wrong email? Go back
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default Signup;