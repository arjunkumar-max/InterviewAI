import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  // 🔥 SMART NAVIGATION: Login hai toh Dashboard, nahi toh Login page!
  const handleStartClick = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* 🌟 Background Neon Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-linear-to-tr from-green-500/20 to-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 🚀 AI Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-green-400 font-medium mb-8 backdrop-blur-md animate-pulse">
        <span>✨ Powered by Next-Gen AI Models</span>
      </div>

      {/* 🎯 Main Hero Heading with Gradient Text */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 text-center tracking-tight leading-tight max-w-4xl">
        Crack Your <span className="bg-linear-to-r from-green-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Dream Job</span> with AI
      </h1>

      {/* 💡 Subtitle */}
      <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-10 leading-relaxed font-normal">
        Personalized mock interviews, real-time AI feedback, resume analysis,
        communication improvement, and placement preparation — <span className="text-gray-200 font-semibold">all in one platform.</span>
      </p>

      {/* 🔘 Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto justify-center z-10">

        {/* Start Button */}
        <button
          onClick={handleStartClick}
          className="w-full sm:w-auto bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black px-8 py-4 rounded-xl text-lg font-extrabold transition duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Start Interview</span>
          <span className="text-xl">🚀</span>
        </button>

        {/* Learn More Button */}
        <button
          onClick={() => navigate('/signup')}
          className="w-full sm:w-auto bg-[#141414] hover:bg-[#1f1f1f] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white px-8 py-4 rounded-xl text-lg font-bold transition duration-300 cursor-pointer flex items-center justify-center"
        >
          Create Free Account ✨
        </button>

      </div>

      {/* 📊 Bottom Trust Stats */}
      <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap justify-center gap-8 md:gap-16 text-center text-gray-500 text-sm">
        <div>
          <span className="block text-xl font-bold text-white">10+</span>
          Technical Topics
        </div>
        <div>
          <span className="block text-xl font-bold text-white">STAR Method</span>
          HR Evaluation
        </div>
        <div>
          <span className="block text-xl font-bold text-white">Real-time</span>
          Voice Recognition
        </div>
      </div>

    </div>
  );
}

export default Home;