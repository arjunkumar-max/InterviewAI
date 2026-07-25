import InterviewChat from './InterviewChat';
import HrInterviewChat from './HrInterviewChat';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPhase, setCurrentPhase] = useState(2); // By default Tech Round (2) chalega
  const [hrQuestions, setHrQuestions] = useState(''); // 🔥 Dynamic HR sawaal save karne ke liye
  const [hrLoading, setHrLoading] = useState(false); // 🔥 Loader dikhane ke liye
  const [techScore, setTechScore] = useState(0);
  // 🔥 STEP 5: Dashboard ke liye history list aur loading state
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Pro-Level UI States for Smart Retry & Lock
  const [timer, setTimer] = useState(0);

  // Security Check & Fetching Past Test History (Step 5 Integrated)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

   const fetchHistory = async () => {
    try {
        const userEmail = localStorage.getItem("userEmail") || localStorage.getItem("email");

        if (!userEmail) {
            console.log("⚠️ No user email found in localStorage!");
            setHistoryList([]);
            setHistoryLoading(false);
            return;
        }

        // Updated to use VITE_API_BASE_URL and point to our new Node /tests endpoint
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        setHistoryList(response.data);
        console.log("📊 History fetched successfully:", response.data);
    } catch (err) {
        console.error("⚠️ Failed to fetch interview history:", err);
    } finally {
        setHistoryLoading(false);
    }
};
    fetchHistory();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login'); 
  };

  // Logic to trigger UI Lock for 60 seconds when API hits limit
  const triggerRetryWithLock = () => {
    setLoading(false);
    setError('⚠️ AI server is currently busy or rate-limited (503/429). Please wait for the timer to retry.');
    setTimer(60);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Resume Upload aur AI Call handling
  const handleStartResumeInterview = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload your PDF resume to start!');
      return;
    }

    setLoading(true);
    setError('');
    setQuestions('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', 'Candidate Technical Profile as per Resume');

    try {
      const token = localStorage.getItem('token'); // Grab token for auth
      
      // Updated to point to new Node resume upload endpoint
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/resume/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` // 🔥 Token added to authenticate file upload
        },
      });

      // Checking for our custom "SERVER_BUSY" signal from AiService
      if (response.data === "SERVER_BUSY") {
        triggerRetryWithLock();
      } else {
        if (response.data.resumeText) {
          localStorage.setItem('resumeText', response.data.resumeText);
        }
        // 🔥 WHITE SCREEN CRASH FIX
        let finalQuestions = response.data;

        if (typeof response.data === 'object' && response.data !== null) {
          const skills = response.data.skills_questions || [];
          const projects = response.data.project_questions || [];
          const allQuestions = [...skills, ...projects];

          // Saare 10 sawaal ko "1. Question..." ke format me string bana do
          finalQuestions = allQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n\n');
        }

        setQuestions(finalQuestions);
        setLoading(false);
      }
    } catch (err) {
      console.error('Resume AI Error:', err);
      triggerRetryWithLock();
    }
  };

  // 🔥 CLEAN & STANDALONE FUNCTION: Phase 3 Start aur Dynamic Questions Generator
  const startPhase3 = async () => {
    setHrLoading(true);
    console.log("👔 Generating dynamic HR questions based on your resume...");
    try {
      const token = localStorage.getItem('token'); // Grab token for auth

      // Updated to point to Node HR generation endpoint
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/chat/hr/generate`, {
        resumeText: localStorage.getItem('resumeText') || "Software Engineer with React and Node.js skills"
      }, {
        headers: {
          'Authorization': `Bearer ${token}` // 🔥 Token added for security
        }
      });

      if (res.data && res.data.questions) {
        setHrQuestions(res.data.questions);
      } else {
        setHrQuestions(res.data);
      }
    } catch (err) {
      console.warn("API fallback: Using intelligent default behavioral questions.", err);
      // 🔥 EASY & NATURAL FALLBACK QUESTIONS:
      setHrQuestions(
        "1. Welcome! To get us started, could you please briefly introduce yourself and walk me through your technical background?\n" +
        "2. I see several interesting skills on your resume. Which programming language or framework do you feel most confident using, and why?\n" +
        "3. Could you briefly describe your favorite project from your resume and explain what your main role was in building it?\n" +
        "4. How do you normally approach learning a new tool or technology when you start a new project?\n" +
        "5. Where do you see yourself growing as a software engineer over the next couple of years?"
      );
    } finally {
      // 3. Sab set hone ke baad screen switch karke Phase 3 me enter karo!
      setHrLoading(false);
      setCurrentPhase(3);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">

        {/* ========================================================================= */}
        {/* 🔥 CONDITION 1: JAB TAK SAWAAL NAHI AAYE HAIN (questions === ''), 
            SIRF TABHI UPAR WALA HEADER AUR GLOWING RESUME CARD DIKHAO! */}
        {/* ========================================================================= */}
        {!questions && (
          <div className="animate-fadeIn space-y-8">

            {/* Top Header Block */}
            <div className="flex justify-between items-center bg-[#141414]/90 backdrop-blur-md p-6 rounded-2xl border border-gray-800 shadow-xl">
              <div>
                <h1 className="text-2xl font-bold tracking-wide text-white flex items-center gap-2">
                  <span>InterviewAI</span>
                  <span className="text-emerald-400 text-xs px-2.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/30 font-mono">PRO 2.0</span>
                </h1>
                <p className="text-xs text-gray-400 mt-1">AI-Powered Resume Analysis & Communication Test</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600/90 hover:bg-red-600 text-white font-semibold py-2 px-5 rounded-xl transition duration-300 text-sm shadow-lg hover:shadow-red-500/20"
              >
                Logout 🔴
              </button>
            </div>

            {/* ✨ NEW FUTURISTIC GLOWING RESUME UPLOAD CARD */}
            <div className="relative p-px bg-linear-to-r from-emerald-500 via-teal-500 to-indigo-600 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              <div className="bg-[#111218]/95 backdrop-blur-xl rounded-[23px] p-6 sm:p-10 border border-white/5 relative overflow-hidden">

                {/* Background Glow Spheres */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    AI Engine: Gemini 1.5 Pro Ready
                  </span>
                  <span className="text-xs text-gray-400 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    ⏱️ Estimated Time: 10 Mins
                  </span>
                </div>

                {/* Main Title & Description */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                  Upload Resume to Initialize <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">AI Mock Round</span> 🚀
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
                  Humara Deep-Learning ATS parser aapke PDF se real-time me <b className="text-gray-200">Skills, Tech-Stack, aur Projects</b> extract karega aur unhi par base karke 10 tailored technical questions generate karega.
                </p>

                {/* Feature Tags / Expectations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                  <div className="flex items-center gap-2.5 bg-white/3 border border-white/5 p-3.5 rounded-xl">
                    <span className="text-lg">🎯</span>
                    <span className="text-xs font-medium text-gray-300">Project-Specific Sawaal</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/3 border border-white/5 p-3.5 rounded-xl">
                    <span className="text-lg">🛡️</span>
                    <span className="text-xs font-medium text-gray-300">Strict Anti-Cheat Proctoring</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/3 border border-white/5 p-3.5 rounded-xl">
                    <span className="text-lg">📊</span>
                    <span className="text-xs font-medium text-gray-300">Instant Scorecard & Verdict</span>
                  </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleStartResumeInterview} className="space-y-6">
                  <div className="relative z-50 pointer-events-auto">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Select Resume File (.pdf only):</label>

                    <div className="border border-dashed border-gray-600 bg-[#181920] rounded-2xl p-4 hover:border-emerald-500/60 transition duration-300">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full text-gray-300 cursor-pointer block opacity-100 relative z-50 pointer-events-auto file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 transition-all"
                        required
                        disabled={loading || timer > 0}
                        style={{ position: 'relative', zIndex: 9999 }}
                      />
                    </div>
                    {file && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold">
                        <span>✅ Selected: {file.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Submit / Retry Button */}
                  <button
                    type="submit"
                    disabled={loading || timer > 0}
                    className={`w-full font-extrabold py-4 px-6 rounded-xl transition-all duration-300 shadow-xl uppercase tracking-wider relative z-50 pointer-events-auto flex items-center justify-center gap-2 text-sm sm:text-base
                      ${timer > 0
                        ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700'
                        : 'bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:scale-[1.01]'}`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Scanning CV & Generating Questions... ⏳</span>
                      </>
                    ) : timer > 0 ? (
                      <span>⏳ Server Busy: Retry in {timer}s</span>
                    ) : (
                      <>
                        <span>ANALYZE RESUME & START INTERVIEW</span>
                        <span className="text-lg">🚀</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {loading && (
              <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-white tracking-wide">🤖 AI is analyzing your resume...</h2>
                <p className="text-gray-400 text-sm mt-2">Crafting custom technical defense questions for you (10/10)</p>
              </div>
            )}
            {/* 🔥 STEP 5 ADDED: Past Performance Analytics Section on Dashboard */}
            <div className="bg-[#141414] p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-xl mt-6">
              <h3 className="text-lg font-bold text-emerald-400 tracking-wide mb-4 flex items-center gap-2">
                <span>📈</span> Your Past Interview Performance History:
              </h3>
              {historyLoading ? (
                <p className="text-gray-400 text-sm">Loading your progress history...</p>
              ) : historyList.length === 0 ? (
                <p className="text-gray-400 text-sm">No past interview history found. Complete a test to track your progress!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300 border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-emerald-300">
                        <th className="py-2 px-3">Session</th>
                        <th className="py-2 px-3">Tech Score</th>
                        <th className="py-2 px-3">HR Score</th>
                        <th className="py-2 px-3">Final Score</th>
                        <th className="py-2 px-3">Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...historyList].reverse().map((item, index) => (
                        <tr key={index} className="border-b border-gray-800/50 hover:bg-white/2">
                          <td className="py-3 px-3 font-mono">Test #{item.id || index + 1}</td>
                          <td className="py-3 px-3">{item.techScore ?? item.overallTechnicalScore ?? item.score ?? 0}%</td>
                          <td className="py-3 px-3">{item.hrScore ?? item.overallCommunicationScore ?? 0}%</td>
                          <td className="py-3 px-3 font-bold text-white">{item.finalScore ?? item.overallScore ?? 0}%</td>
                          <td className="py-3 px-3 text-emerald-400 font-semibold">{item.verdict ?? item.finalVerdict ?? "COMPLETED"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Display Error if any */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl text-center my-6 font-semibold animate-bounce">
            {error}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🔥 CONDITION 2: JAISE HI 10 SAWAAL AA JAYEIN, UPAR KA SAB GAYAB 
            AUR APNA EXAM ROOM WITH PREVIEW LIST RENDER HOGA! */}
        {/* ========================================================================= */}
        {questions && (
          <div className="space-y-8 animate-fadeIn mt-2">

            {/* 🔥 WAPAS ADD KAR DIYA TERA 10 SAWAAL WALA LIST PREVIEW! */}
            <div className="bg-[#141414] p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-xl transition-all duration-500">
              <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-emerald-400 tracking-wide flex items-center gap-2">
                  <span>🎯</span> 10 Customized Technical Questions:
                </h3>
                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700 font-mono">Phase 1: Complete</span>
              </div>

              <div className="bg-[#1a1b22] p-6 rounded-xl border border-gray-800 text-gray-200 font-mono text-sm leading-relaxed whitespace-pre-line shadow-inner">
                {questions}
              </div>
            </div>

            {/* 🔥 PILLAR 2 & 3: DYNAMIC SCREEN SWITCHER */}
            {currentPhase === 2 ? (
              <InterviewChat
                questionsList={questions}
                onStartPhase3={(score) => {
                  setTechScore(score); // 🎯 Score yahan save hoga
                  startPhase3();
                }}
              />
            ) : (
              <HrInterviewChat
                hrQuestionsList={hrQuestions}
                techPercentage={techScore} // 🎯 Ab hamesha 80 nahi aayega, real score aayega!
              />
            )}
          </div>
        )}

      </div>
      {/* 🔥 HR Loading Popup in Parent - Yeh kabhi unmount nahi hoga! */}
      {hrLoading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-99999">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-white tracking-wide">🚀 Analyzing & Preparing HR Round...</h2>
          <p className="text-gray-400 text-sm mt-2">Please wait, AI is generating your personalized HR interview questions.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;