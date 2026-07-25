import React, { useRef } from 'react';
import axios from 'axios';

const PlacementVerdictModal = ({ isOpen, onClose, hrScoreHistory, techPercentage = 80 }) => {
    // 🔥 1. Yahan humne Lock banaya (useRef import karna mat bhoolna)
    const isSavingRef = useRef(false); 

    if (!isOpen) return null;

    // 1. Math Aggregator for HR Round (Safe mapping with max 100% cap)
    const totalQs = hrScoreHistory.length || 1;
    const sumComm = hrScoreHistory.reduce((acc, curr) => acc + (curr.communicationScore || curr.overallCommunicationScore || 0), 0);
    const sumLead = hrScoreHistory.reduce((acc, curr) => acc + (curr.leadershipScore || curr.score || 0), 0);
    const sumStar = hrScoreHistory.reduce((acc, curr) => acc + (curr.starMethodRating || curr.starScore || 0), 0);

    const commPct = Math.min(100, Math.round((sumComm / (totalQs * 10)) * 100)) || 0;
    const leadPct = Math.min(100, Math.round((sumLead / (totalQs * 10)) * 100)) || 0;
    const starPct = Math.min(100, Math.round((sumStar / (totalQs * 10)) * 100)) || 0;

    // HR Average Percentage
    const hrPercentage = Math.round((commPct + leadPct + starPct) / 3);

    // 2. GRAND FINAL EMPLOYABILITY SCORE (60% Tech + 40% HR) - Capped at 100%
    const finalScore = Math.min(100, Math.round((Number(techPercentage) * 0.6) + (Number(hrPercentage) * 0.4)));

    // 3. Verdict Chip & Recommendation (Strict validation for skipped/low scores)
    const getVerdict = (score, isSkippedAll) => {
        if (isSkippedAll || score < 50) return { title: "📚 NEEDS PRACTICE & RE-INTERVIEW", color: "from-orange-500 to-red-500 text-white font-black", desc: "Candidate skipped critical questions or struggled with structured delivery." };
        if (score >= 80) return { title: "🎉 PROCEED TO HIRE (OFFER EXTENDED)", color: "from-green-500 to-emerald-400 text-black font-black", desc: "Candidate demonstrated exceptional technical foundations and executive communication skills." };
        return { title: "⚡ HOLD & RE-EVALUATE (STRONG POTENTIAL)", color: "from-amber-500 to-yellow-400 text-black font-black", desc: "Good technical skills but needs minor refinement in behavioral leadership and STAR articulation." };
    };

    const verdict = getVerdict(finalScore, hrPercentage === 0);

    // Fetch dynamic feedback safely
    const latestHrItem = hrScoreHistory[hrScoreHistory.length - 1] || {};
    const executiveNotes = latestHrItem.hrFeedback || latestHrItem.overallFeedback || 'Strong communication skills exhibited throughout the session. Continue focusing on quantifiable business impacts.';
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 animate-fadeIn">
            <div className="bg-[#141414] border-2 border-green-500/60 rounded-3xl max-w-2xl w-full p-8 shadow-[0_0_60px_rgba(34,197,94,0.2)] relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">

                {/* Header Badge */}
                <div className="flex flex-col items-center text-center gap-2 border-b border-gray-800 pb-6">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">🏆 Final Interview Assessment</span>
                    <span className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest bg-linear-to-r shadow-xl mt-1 ${verdict.color}`}>
                        {verdict.title}
                    </span>
                    <p className="text-xs text-gray-300 mt-2 max-w-md leading-relaxed">{verdict.desc}</p>
                </div>

                {/* Grand Score Display */}
                <div className="bg-linear-to-b from-[#1f1f1f] to-[#161616] border border-gray-700/80 p-6 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                    <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Final Employability Index</span>
                    <span className="text-5xl font-black text-green-400 mt-1 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]">{finalScore}%</span>
                    <div className="flex gap-4 mt-3 text-xs font-semibold text-gray-400">
                        <span>⚡ Tech Round: <strong className="text-amber-400">{techPercentage}%</strong> (60% Wt)</span>
                        <span>•</span>
                        <span>🗣️ HR Round: <strong className="text-blue-400">{hrPercentage}%</strong> (40% Wt)</span>
                    </div>
                </div>

                {/* HR Soft-Skills Breakdown Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#1e1e1e] border border-gray-800 p-3.5 rounded-xl text-center">
                        <span className="text-[10px] text-gray-400 uppercase font-mono block">🗣️ Communication</span>
                        <span className="text-2xl font-black text-blue-400 mt-1 block">{commPct}%</span>
                    </div>
                    <div className="bg-[#1e1e1e] border border-gray-800 p-3.5 rounded-xl text-center">
                        <span className="text-[10px] text-gray-400 uppercase font-mono block">👑 Leadership</span>
                        <span className="text-2xl font-black text-purple-400 mt-1 block">{leadPct}%</span>
                    </div>
                    <div className="bg-[#1e1e1e] border border-gray-800 p-3.5 rounded-xl text-center">
                        <span className="text-[10px] text-gray-400 uppercase font-mono block">🌟 STAR Structure</span>
                        <span className="text-2xl font-black text-yellow-400 mt-1 block">{starPct}%</span>
                    </div>
                </div>

                {/* HR Director Top Feedback */}
                <div className="bg-[#1c1c1c] border border-gray-800 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider">💡 HR Director Executive Notes:</h4>
                    <p className="text-xs text-gray-300 leading-relaxed italic">
                        "{executiveNotes}"
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={onClose}
                    className="w-full bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,197,94,0.3)] transition duration-200"
                >
                    🔍 Review Complete Interview Transcripts
                </button>
                {/* 🎉 RETURN TO MAIN DASHBOARD / START NEW INTERVIEW BUTTON */}
               {/* 🎉 RETURN TO MAIN DASHBOARD BUTTON */}
                <button
                    onClick={() => {
                        // ❌ Yahan se axios.post delete kar diya kyunki HrInterviewChat already save kar chuka hai!
                        
                        // Bas session clear karo aur dashboard pe bhejo
                        localStorage.removeItem("activeInterviewSession");
                        localStorage.removeItem("activeHrInterviewSession"); // HR ka bhi clear kar diya
                        localStorage.removeItem("disqualifiedUntil");
                        window.location.href = "/dashboard";
                    }}
                    className="w-full mt-3 bg-linear-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold py-4 px-6 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 text-sm sm:text-base uppercase tracking-wider border border-indigo-400/30"
                >
                    <span>🎉 Thank You! Complete Exam & Return to Dashboard</span>
                    <span className="text-xl">🏠</span>
                </button>
            </div>
        </div>
    );
};

export default PlacementVerdictModal;