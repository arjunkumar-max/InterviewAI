import React, { useState } from 'react';

const ReportCardModal = ({ isOpen, onClose, scoreHistory, onProceedToPhase3 }) => {
  if (!isOpen) return null;

  // 1. Math Aggregator: Calculate Averages & Percentages
  const totalQuestions = scoreHistory.length || 1;

  const sumTech = scoreHistory.reduce((acc, curr) => acc + (curr.technicalScore || 0), 0);
  const sumArt = scoreHistory.reduce((acc, curr) => acc + (curr.communicationScore || 0), 0);

  const techPercentage = Math.round((sumTech / (totalQuestions * 10)) * 100);
  const artPercentage = Math.round((sumArt / (totalQuestions * 10)) * 100);

  // Overall Weighted Score (60% Tech, 40% Articulation)
  const overallScore = Math.round((techPercentage * 0.6) + (artPercentage * 0.4));

  // 2. Extract Top Feedback Insights
  const lowScoringAnswers = scoreHistory.filter(s => (s.technicalScore || 0) < 7);
  const improvementTips = lowScoringAnswers.length > 0
    ? lowScoringAnswers.map(s => s.feedback).slice(0, 3) // Top 3 critical feedbacks
    : [
      "Your technical core foundations are exceptionally strong!",
      "Try to include real-world production metrics when explaining system design concepts.",
      "Maintain this high level of structured articulation in HR & Behavioral rounds."
    ];

  // 3. Performance Badge
  const getBadge = (score) => {
    if (score >= 85) return { label: "🏆 TOP 1% ELITE CANDIDATE", color: "from-amber-500 to-yellow-400 text-black font-extrabold" };
    if (score >= 70) return { label: "🌟 INTERVIEW READY (HIRE)", color: "from-green-500 to-emerald-400 text-black font-bold" };
    return { label: "⚡ NEEDS TECHNICAL REFINEMENT", color: "from-orange-500 to-red-500 text-white font-bold" };
  };

  const badge = getBadge(overallScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#181818] border-2 border-green-500/50 rounded-3xl max-w-2xl w-full p-8 shadow-[0_0_50px_rgba(34,197,94,0.15)] relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">

        {/* Header Badge */}
        <div className="flex flex-col items-center text-center gap-2 border-b border-gray-800 pb-6">
          <span className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-widest bg-linear-to-r shadow-lg ${badge.color}`}>
            {badge.label}
          </span>
          <h2 className="text-2xl font-black text-white tracking-wide mt-2">
            PHASE 2: TECHNICAL DEFENSE REPORT
          </h2>
          <p className="text-xs text-gray-400">
            Validated by AI Interviewer • 10/10 Questions Evaluated
          </p>
        </div>

        {/* Score Dashboard Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#222] border border-gray-700/60 p-4 rounded-2xl text-center flex flex-col justify-center">
            <span className="text-[11px] text-gray-400 uppercase font-mono tracking-wider">Overall Match</span>
            <span className="text-3xl font-black text-green-400 mt-1">{overallScore}%</span>
          </div>

          <div className="bg-[#222] border border-gray-700/60 p-4 rounded-2xl text-center flex flex-col justify-center">
            <span className="text-[11px] text-gray-400 uppercase font-mono tracking-wider">Tech Accuracy</span>
            <span className="text-3xl font-black text-amber-400 mt-1">{techPercentage}%</span>
            <span className="text-[10px] text-gray-500 mt-0.5">{sumTech}/{totalQuestions * 10} Pts</span>
          </div>

          <div className="bg-[#222] border border-gray-700/60 p-4 rounded-2xl text-center flex flex-col justify-center">
            <span className="text-[11px] text-gray-400 uppercase font-mono tracking-wider">Articulation</span>
            <span className="text-3xl font-black text-blue-400 mt-1">{artPercentage}%</span>
            <span className="text-[10px] text-gray-500 mt-0.5">{sumArt}/{totalQuestions * 10} Pts</span>
          </div>
        </div>

        {/* Actionable Improvement Tips */}
        <div className="bg-[#202020] border border-gray-800 p-5 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
            💡 AI Coach Insights & Improvement Tips:
          </h4>
          <ul className="space-y-2.5 text-xs text-gray-300 leading-relaxed">
            {improvementTips && improvementTips.map((tip, idx) => {
              if (!tip) return null;
              return (
                <li key={idx} className="flex items-start gap-2.5 bg-black/40 p-3 rounded-xl">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>{typeof tip === 'object' ? (tip.text || tip.suggestion || JSON.stringify(tip)) : tip}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition duration-200"
          >
            🔍 Review Chat Answers
          </button>

          <button
            onClick={() => {
              // Sirf parent function call hoga, timer aur loader parent sambhalega!
              if (onClose) onClose();
              if (onProceedToPhase3) {
                onProceedToPhase3();
              } else {
                console.error("onProceedToPhase3 prop is missing!");
              }
            }}
            className="flex-1 bg-linear-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
          >
            <span>👉 Proceed to Phase 3: HR Round</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReportCardModal;