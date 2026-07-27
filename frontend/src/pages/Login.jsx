import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // Email ya Phone dono store karega
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // 🔥 Forgot Password ke liye naye states:
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // Step 1: Email daalo, Step 2: OTP & New Pass daalo
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingOtp, setLoadingOtp] = useState(false);

  // 🛡️ Fallback to '/api' if the env variable is undefined in production (Matches vercel.json)
  const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // 🔥 STRICT PRO REGEX: Sirf @gmail.com ya Indian 10-digit number allow karega
  const validateInput = (input) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^[6-9]\d{9}$/; // 6,7,8,9 se shuru hone wala 10 digit number
    return gmailRegex.test(input) || phoneRegex.test(input);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateInput(identifier)) {
      setError("❌ Please enter a valid '@gmail.com' address or a 10-digit mobile number!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: identifier,
        password: password
      });

      localStorage.setItem('token', res.data.token || res.data);
      localStorage.setItem('userEmail', identifier);

      navigate('/dashboard');
    } catch (err) {
      // 🛡️ Strict String Extraction to prevent React Error #31 & show real backend errors
      let errorMessage = "❌ Invalid credentials. Please try again!";
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (typeof err.response.data.message === 'string') {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data.error === 'string') {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // 📩 Step 1: OTP bhejo
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoadingOtp(true);
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password/send-otp`, {
        email: forgotEmail,
      });
      alert(res.data.message || "OTP sent successfully! Check your Gmail 📬");
      setForgotStep(2); // Step 2 (OTP box) par bhejo
    } catch (err) {
      // Safe alert extraction
      let errorMsg = "Error sending OTP! Please try again.";
      if (typeof err.response?.data?.message === 'string') {
        errorMsg = err.response.data.message;
      }
      alert(errorMsg);
    } finally {
      setLoadingOtp(false);
    }
  };

  // 🔐 Step 2: OTP verify karke password reset karo
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password/reset`, {
        email: forgotEmail,
        otp: otp,
        newPassword: newPassword,
      });
      alert(res.data.message || "Password reset successful! 🎉");
      setShowForgotModal(false); // Modal band kar do
      setForgotStep(1);
    } catch (err) {
      // Safe alert extraction
      let errorMsg = "Invalid OTP! Please try again.";
      if (typeof err.response?.data?.message === 'string') {
        errorMsg = err.response.data.message;
      }
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#141414] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">

        {/* Glow Effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <h2 className="text-3xl font-extrabold text-white text-center mb-2">Welcome Back 👋</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Login to continue your AI Interview preparation</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-xl mb-4 text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Gmail or Phone Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="example@gmail.com"
              required
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
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
              placeholder="••••••••"
              required
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-white transition text-sm cursor-pointer"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
            {/* 🔥 Password input ke theek niche ye link add kar do */}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotStep(1);
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Forgot Password? 🔐
              </button></div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-green-500/20 cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login 🚀"}
          </button>
        </form>
        {/* ========================================================= */}
        {/* 🔥 GOOGLE ONE-TAP LOGIN SECTION */}
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

                const res = await axios.post(`${API_URL}/auth/google-login`, {
                  email: decoded.email,
                  name: decoded.name,
                  picture: decoded.picture
                });

                localStorage.setItem('token', res.data.token);
                localStorage.setItem('userEmail', decoded.email);
                alert(`🎉 Welcome ${decoded.name}! Logged in with Google.`);
                navigate('/dashboard');
              } catch (err) {
                console.error("Backend Google Auth Error:", err);
                
                let errorMessage = "❌ Google Login failed on server! Please try again.";
                if (err.response?.data) {
                  if (typeof err.response.data === 'string') errorMessage = err.response.data;
                  else if (typeof err.response.data.message === 'string') errorMessage = err.response.data.message;
                }
                setError(errorMessage);
              }
            }}
            onError={() => {
              setError("❌ Google Login Popup Failed!");
            }}
            theme="filled_black"
            shape="pill"
            size="large"
            width="350"
            text="continue_with"
          />
        </div>
        <p className="text-gray-400 text-sm text-center mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-green-400 hover:underline font-bold">
            Signup
          </Link>
        </p>
      </div>
      {/* ========================================================================= */}
      {/* 🔥 FORGOT PASSWORD MODAL POP-UP */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-fadeIn">

            {/* Close Button */}
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-2">
              {forgotStep === 1 ? "Reset Your Password 🔐" : "Enter Verification OTP 📬"}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {forgotStep === 1
                ? "Apna registered email daalo, hum 6-digit verification code bhejenge."
                : `Humne ${forgotEmail} par ek 6-digit OTP bheja hai.`}
            </p>

            {/* STEP 1: EMAIL INPUT FORM */}
            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingOtp}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-2.5 rounded-lg text-white transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {loadingOtp ? "Sending OTP... ⏳" : "Send OTP 🚀"}
                </button>
              </form>
            ) : (
              /* STEP 2: OTP & NEW PASSWORD FORM */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white tracking-widest text-center text-lg font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create strong password"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-500 font-semibold py-2.5 rounded-lg text-white transition-all shadow-lg mt-2 cursor-pointer"
                >
                  Reset & Save Password ✨
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
