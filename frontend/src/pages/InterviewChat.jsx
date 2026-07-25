import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReportCardModal from '../components/ReportCardModal';

// 🔥 UPGRADE 1: Added onStartPhase3 prop here!
const InterviewChat = ({ questionsList, onStartPhase3 }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverBusyError, setServerBusyError] = useState(false);
  const messagesEndRef = useRef(null);

  // 🔥 NEW STATE: Saare 10 sawaal-jawaab ko frontend me save rakhne ke liye (0 API calls me)
  const [qaHistory, setQaHistory] = useState([]);

  // 🔥 Track scores and modal open/close
  const [scoreHistory, setScoreHistory] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 🔥 Anti-Cheat & Lock States
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [lockEndTime, setLockEndTime] = useState(null);

  // 🔄 Session Recovery States
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState(null);

  // 🕵️‍♂️ TAB SWITCH DETECTOR
  useEffect(() => {
    const savedLock = localStorage.getItem("disqualifiedUntil");
    if (savedLock && Date.now() < parseInt(savedLock)) {
      setIsDisqualified(true);
      setLockEndTime(new Date(parseInt(savedLock)).toLocaleTimeString());
      return;
    } else if (savedLock) {
      localStorage.removeItem("disqualifiedUntil");
    }

    const handleVisibilityChange = () => {
      if (document.hidden && !isDisqualified) {
        setWarnings((prev) => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            const unlockTime = Date.now() + 60 * 60 * 1000;
            localStorage.setItem("disqualifiedUntil", unlockTime);
            setIsDisqualified(true);
            setLockEndTime(new Date(unlockTime).toLocaleTimeString());
            alert("🚫 YOU ARE DISQUALIFIED! 3 Tab switches detected. Try again after 1 hour.");
          } else {
            setShowWarningModal(true);
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isDisqualified]);

  //scroll feature
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [questions, messages]); // Jab bhi questions ya messages change honge, ye chal padega

  // 💾 Session Save Helper
  const saveCurrentSession = (chatHistory, questionCount) => {
    const sessionData = {
      chatHistory: chatHistory,
      questionCount: questionCount,
      timestamp: Date.now(),
    };
    localStorage.setItem("activeInterviewSession", JSON.stringify(sessionData));
  };

  // 🔄 Page Load Session Check (15 mins)
  useEffect(() => {
    const saved = localStorage.getItem("activeInterviewSession");
    if (saved) {
      const parsed = JSON.parse(saved);
      const timePassed = Date.now() - parsed.timestamp;
      const fifteenMinutes = 15 * 60 * 1000;

      if (timePassed <= fifteenMinutes) {
        setSavedSessionData(parsed);
        setShowResumeBanner(true);
      } else {
        localStorage.removeItem("activeInterviewSession");
      }
    }
  }, []);

  const handleResumeInterview = () => {
    if (savedSessionData) {
      setShowResumeBanner(false);
      alert("🎉 Interview Resumed! Wahi se continue karo jahan chhoda tha.");
    }
  };

  // 1. Parse Questions List
  useEffect(() => {
    if (questionsList) {
      const parsedQuestions = questionsList
        .split(/\n/)
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.trim());

      setQuestions(parsedQuestions);

      if (parsedQuestions.length > 0) {
        setMessages([
          {
            sender: 'ai',
            text: `👋 Hello! I have reviewed your resume. Let's begin Phase 2 (Live 1-on-1 Technical Round).\n\nHere is your first question:\n\n👉 **${parsedQuestions[0]}**`
          }
        ]);
      }
    }
  }, [questionsList]);


  // =========================================================================
  // 🔥 NEW ARCHITECTURE LOGIC: Q1 TO Q9 LOCAL SAVE (0MS), Q10 BATCH EVALUATION
  // =========================================================================
  const processAnswerAndMoveForward = async (answerText, isSkipped) => {
    if (!answerText.trim() && !isSkipped) return;

    setServerBusyError(false);
    setLoading(true);

    const currentQText = questions[currentIndex];
    const nextIndex = currentIndex + 1;
    const isLastQuestion = nextIndex >= questions.length;

    // 1. Add answer to local UI messages
    const displayAnswer = isSkipped ? "⏭️ *Skipped this question*" : answerText;
    const updatedMessages = [...messages, { sender: 'user', text: displayAnswer }];
    setMessages(updatedMessages);
    setUserInput('');

    // 2. Prepare QA Pair for Backend Bundle
    const newQaPair = {
      questionNumber: currentIndex + 1,
      questionText: currentQText,
      userAnswer: isSkipped ? "SKIPPED_BY_CANDIDATE" : answerText,
      isSkipped: isSkipped,
      feedback: "Pending evaluation..."
    };

    const updatedQaHistory = [...qaHistory, newQaPair];
    setQaHistory(updatedQaHistory);
    saveCurrentSession(updatedMessages, nextIndex);

    // 3. CHECK: Agar Q1 se Q9 hai, toh BINA API call kiye turant agla sawaal dikhao (0ms latency!)
    if (!isLastQuestion) {
      const nextQText = questions[nextIndex];
      setMessages([
        ...updatedMessages,
        { sender: 'ai', text: `Got it! Let's move to the next question:\n\n👉 **${nextQText}**` }
      ]);
      setCurrentIndex(nextIndex);
      setLoading(false);
      return;
    }

    // 4. FINAL QUESTION (Q10): Ab hum Technical Batch Endpoint par poora bundle bhejenge!
    setMessages([
      ...updatedMessages,
      { sender: 'ai', text: "🤖 **Technical Round Completed!** AI Architect is analyzing your complete transcript across all 10 questions. Creating your Final Report Card... Please wait." }
    ]);

    try {
      const token = localStorage.getItem('token');
      const userEmail = localStorage.getItem('userEmail') || "test@user.com";

      // 🔥 HIT TECHNICAL BATCH EVALUATE ENDPOINT:
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/chat/technical`, {
        userEmail: userEmail,
        qaList: updatedQaHistory
      }, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      console.log("🎉 Technical Batch Report Received:", res.data);

      if (res.data) {
        setScoreHistory([res.data]); // Report card modal format ke mutabiq

        // 🔥 Enriched qaHistory mapping with questionWiseFeedback (0 Extra API calls!)
        if (res.data.questionWiseFeedback && Array.isArray(res.data.questionWiseFeedback)) {
          const enrichedHistory = updatedQaHistory.map((item) => {
            const matchedFeedback = res.data.questionWiseFeedback.find(
              (f) => Number(f.questionNumber) === Number(item.questionNumber)
            );
            return {
              ...item,
              feedback: matchedFeedback ? matchedFeedback.feedback : "Evaluated holistically."
            };
          });
          setQaHistory(enrichedHistory);
        }
      }

      setCurrentIndex(nextIndex);
      setIsReportModalOpen(true);
      localStorage.removeItem("activeInterviewSession");

    } catch (err) {
      console.error("❌ Technical Batch Evaluation Failed:", err);
      setServerBusyError(true);
      setCurrentIndex(nextIndex);
      setIsReportModalOpen(true); // Fallback modal open
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!userInput.trim() || loading) return;
    processAnswerAndMoveForward(userInput, false);
  };

  // === ⏭️ SKIP HANDLER ===
  const handleSkipQuestion = (e) => {
    e?.preventDefault();
    if (loading) return;
    processAnswerAndMoveForward("Skipped", true);
  };

  // Helper Function: Safe rendering for Strings OR JSON Objects
  const renderMessageContent = (msgText) => {
    if (typeof msgText === 'object' && msgText !== null) {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="bg-green-500/20 text-green-400 border border-green-500/40 px-2.5 py-1 rounded-lg text-xs font-bold">
              ⚡ Technical: {msgText.overallTechnicalScore || 0}/100
            </span>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2.5 py-1 rounded-lg text-xs font-bold">
              ✍️ Communication: {msgText.overallCommunicationScore || 0}/100
            </span>
          </div>

          <div className="text-gray-200 text-sm leading-relaxed">
            <strong className="text-green-400 block mb-1">💡 Overall Feedback:</strong>
            {msgText.overallFeedback}
          </div>
        </div>
      );
    }

    return <div className="whitespace-pre-line">{String(msgText)}</div>;
  };

  const handleRetryEvaluation = async () => {
    setServerBusyError(false);
    setLoading(true);
    setMessages(prev => [...prev, { sender: 'ai', text: "🔄 Retrying final batch evaluation with existing transcript..." }]);

    try {
      const token = localStorage.getItem('token');
      const userEmail = localStorage.getItem('userEmail') || "test@user.com";

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/chat/technical`, {
        userEmail: userEmail,
        qaList: qaHistory
      }, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (res.data) {
        setScoreHistory([res.data]);

        // Enriched mapping on retry as well
        if (res.data.questionWiseFeedback && Array.isArray(res.data.questionWiseFeedback)) {
          const enrichedHistory = qaHistory.map((item) => {
            const matchedFeedback = res.data.questionWiseFeedback.find(
              (f) => Number(f.questionNumber) === Number(item.questionNumber)
            );
            return {
              ...item,
              feedback: matchedFeedback ? matchedFeedback.feedback : "Evaluated holistically."
            };
          });
          setQaHistory(enrichedHistory);
        }
      }
      setIsReportModalOpen(true);
      localStorage.removeItem("activeInterviewSession");
    } catch (err) {
      console.error("❌ Retry Failed:", err);
      setServerBusyError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl shadow-2xl flex flex-col h-[600px] mt-8 relative z-20">

      {/* Chat Header */}
      <div className="bg-[#262626] p-4 rounded-t-2xl border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <h3 className="font-bold text-gray-200 text-sm">Live AI Interviewer (Round 1: Technical)</h3>
            <p className="text-[10px] text-gray-400">⚡ 2 AI Calls Architecture (Zero-Latency Transitions)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {scoreHistory.length > 0 && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="text-[11px] bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-lg font-bold transition"
            >
              📊 View Report Card
            </button>
          )}

          <span className="text-xs bg-gray-800 text-green-400 px-3 py-1 rounded-full border border-green-500/20 font-mono">
            Question {Math.min(currentIndex + 1, questions.length)} / {questions.length || 10}
          </span>

        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex animate-fadeIn ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
              ? 'bg-linear-to-r from-green-600 to-emerald-600 text-black font-medium rounded-br-none shadow-lg'
              : 'bg-[#262626] border border-gray-700 text-gray-200 rounded-bl-none shadow-md'
              }`}>
              {renderMessageContent(msg.text)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* 🔥 QA History Transcript & Feedback Display Section */}
        {qaHistory.length > 0 && currentIndex >= questions.length && (
          <div className="mt-6 border-t border-gray-700/60 pt-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-green-400">📋 Complete Transcript & Question Feedback:</h4>
            {qaHistory.map((item, idx) => (
              <div key={idx} className="bg-[#1f1f1f] border border-gray-800 p-3.5 rounded-xl space-y-1.5">
                <p className="text-xs font-bold text-white">Q{item.questionNumber}: {item.questionText}</p>
                <p className="text-xs text-gray-300">
                  <strong className="text-green-400">Your Answer:</strong> {item.userAnswer}
                </p>
                <p className="text-xs text-emerald-400 pt-1">
                  💡 Feedback: {item.feedback || "Evaluated holistically."}
                </p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#262626] border border-gray-700 text-green-400 p-4 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 animate-pulse">
              🤖 AI Architect is analyzing your complete interview transcript...
            </div>
          </div>
        )}

        {serverBusyError && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl text-xs text-center flex flex-col items-center gap-2">
            <span>⚠️ AI Server is temporarily busy or rate-limited. Your data is saved. Click below to retry final evaluation!</span>
            <button
              onClick={handleRetryEvaluation}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg font-bold uppercase tracking-wide transition"
            >
              🔄 Retry Final Evaluation
            </button>
          </div>
        )}
      </div>

      {/* Input Box */}
      {currentIndex >= questions.length ? (
        <div className="p-4 bg-[#262626] rounded-b-2xl border-t border-gray-700 flex flex-col sm:flex-row gap-3 justify-center items-center animate-fadeIn">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto flex-1 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 px-6 rounded-xl transition duration-200 text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 border border-blue-400/30"
          >
            📊 Re-open Final Report Card
          </button>

        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="p-4 bg-[#262626] rounded-b-2xl border-t border-gray-700 flex gap-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your technical answer here..."
            disabled={loading}
            className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-3 text-gray-200 focus:outline-none focus:border-green-500 text-sm disabled:opacity-50"
          />

          <button
            type="button"
            onClick={handleSkipQuestion}
            disabled={loading}
            className="px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition duration-200 shadow-md flex items-center gap-1 shrink-0 cursor-pointer"
            title="Skip this question if you don't know the answer"
          >
            ⏭️ Skip
          </button>

          <button
            type="submit"
            disabled={loading || !userInput.trim()}
            className="bg-green-500 hover:bg-green-400 text-black font-extrabold px-6 py-3 rounded-xl transition duration-200 disabled:bg-gray-600 disabled:text-gray-400 text-sm uppercase tracking-wider shadow-lg"
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>
      )}
      <ReportCardModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        scoreHistory={scoreHistory}
        onProceedToPhase3={() => {
          setIsReportModalOpen(false); 
          if (onStartPhase3) {
            onStartPhase3(); // Direct call maro, koi timer nahi!
          }
        }}
      />

      {/* Resume Banner */}
      {showResumeBanner && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-2xl bg-gray-900/90 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="text-white font-bold text-sm sm:text-base">Unfinished Interview Detected!</h4>
              <p className="text-gray-400 text-xs">Aapka pichla session 15 minute ke andar ka hai. Wahi se shuru karein?</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleResumeInterview}
              className="flex-1 sm:flex-none bg-linear-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-lg"
            >
              Resume Now 🚀
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("activeInterviewSession");
                setShowResumeBanner(false);
              }}
              className="bg-gray-800 text-gray-300 text-xs py-2 px-3 rounded-xl"
            >
              Start Fresh 🗑️
            </button>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-red-500 rounded-3xl p-6 max-w-md w-full text-center">
            <h3 className="text-xl font-extrabold text-white mb-2">WARNING {warnings} OF 3!</h3>
            <p className="text-gray-300 text-sm mb-6">
              Tab switching is strictly prohibited! Agar aapne <span className="text-red-400 font-bold">{3 - warnings} baar aur</span> tab switch kiya, toh exam cancel ho jayega.
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl"
            >
              I Understand, Return to Exam 🎯
            </button>
          </div>
        </div>
      )}

      {/* Disqualified Screen */}
      {isDisqualified && (
        <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-50 p-6 text-center">
          <h1 className="text-3xl font-black text-red-500 mb-2">DISQUALIFIED</h1>
          <p className="text-gray-400 max-w-md mb-8">Multiple tab switches detected. Profile temporarily blocked.</p>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 px-8 mb-6">
            <span className="text-xs text-gray-500 uppercase block mb-1">Unlock Time</span>
            <span className="text-2xl font-mono font-bold text-white">{lockEndTime}</span>
          </div>
        </div>
      )}
    </div>
  );
};


export default InterviewChat;