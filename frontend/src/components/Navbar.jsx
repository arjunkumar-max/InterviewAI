import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // 🔥 PRO RULE 1: Agar user Live Interview de raha hai, toh Navbar poora chhupado (No Distraction!)
  if (location.pathname.includes('/interview') || location.pathname.includes('/phase')) {
    return null; 
  }

  // 🔥 PRO RULE 2: Logout karne par token delete karo aur Home pe bhejo
  const handleLogout = () => {
    localStorage.clear();
    navigate('/'); 
  };

  return (
    <nav className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800/80 text-white px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
      
      {/* Brand Logo */}
      <Link to="/" className="text-2xl font-black tracking-wider bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
        InterviewAI
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-6 font-semibold text-sm">
        
        <Link to="/" className="text-gray-300 hover:text-white transition">
          Home
        </Link>

        {/* 👇 CONDITIONAL LOGIC: Agar Login hai toh DASHBOARD + LOGOUT dikhao 👇 */}
        {token ? (
          <>
            <Link 
              to="/dashboard" 
              className="text-green-400 hover:text-green-300 font-bold transition flex items-center gap-1"
            >
              <span>Dashboard</span>
              <span>⚡</span>
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl font-bold transition cursor-pointer"
            >
              Logout 🔴
            </button>
          </>
        ) : (
          /* 👇 Agar Login NAHI hai toh sirf LOGIN + SIGNUP dikhao 👇 */
          <>
            <Link to="/login" className="text-gray-300 hover:text-white transition">
              Login
            </Link>

            <Link
              to="/signup"
              className="bg-white hover:bg-gray-200 text-black px-5 py-2 rounded-xl font-extrabold transition shadow-md hover:scale-105"
            >
              Signup ✨
            </Link>
          </>
        )}

      </div>
    </nav>
  );
};

export default Navbar;