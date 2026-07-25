import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// Double-check this file path matches your exact folder structure!
import PlacementVerdictModal from '../components/PlacementVerdictModal';

const HrInterviewChat = ({ hrQuestionsList, techPercentage = 80 }) => {
    // === 1. EXISTING NORMAL STATES ===
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [serverBusyError, setServerBusyError] = useState(false);
    const recognitionRef = useRef(null); // 🔥 Mic instance ko track karne ke liye
    const isIntentionallyStoppedRef = useRef(false);
    const [showResumeBanner, setShowResumeBanner] = useState(false);
    const [savedSessionData, setSavedSessionData] = useState(null);
    const messagesEndRef = useRef(null);
    const hasSavedRef = useRef(false); // 🔥 Duplicate save rokne ke liye lock

    // 🔥 NEW STATE: Saare sawaal-jawaab ko frontend me save rakhne ke liye (0 API calls me)
    const [qaHistory, setQaHistory] = useState([]);

    // HR Round state
    const [hrScoreHistory, setHrScoreHistory] = useState([]);
    const [isVerdictModalOpen, setIsVerdictModalOpen] = useState(false);

    // === 2. NEW VOICE & UX STATES ===
    const [isListening, setIsListening] = useState(false);
    const [countdown, setCountdown] = useState(null);

    // === 3. WEB SPEECH API FUNCTION ===
    const startVoiceRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("❌ Your browser does not support Voice Recognition. Please use Google Chrome.");
            return;
        }

        // 1. Agar pehle se koi mic chal raha ho toh usko safely band karo
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            } catch (err) { }
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true; // Live typing on
        recognition.lang = 'en-US';

        // 🔥 STEP 1: Mic chalu hote hi pehle ka typed text ek variable me save kar lo
        const baseText = userInput.trim() ? userInput.trim() + ' ' : '';

        if (typeof isIntentionallyStoppedRef !== 'undefined') {
            isIntentionallyStoppedRef.current = false;
        }
        setIsListening(true);

        recognition.onresult = (event) => {
            // 🔥 STEP 2: Index 0 se poora speech rebuild karo taaki interim guesses repeat na hon!
            let currentSpeech = '';
            for (let i = 0; i < event.results.length; i++) {
                currentSpeech += event.results[i][0].transcript;
            }

            // Purane baseText ke aage naya clean speech laga do
            if (typeof setUserInput === 'function') {
                setUserInput(baseText + currentSpeech);
            }
        };

        recognition.onerror = (event) => {
            console.warn("🎙️ Mic Error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            if (typeof isIntentionallyStoppedRef !== 'undefined' && !isIntentionallyStoppedRef.current) {
                setIsListening(false);
            }
        };

        try {
            recognition.start();
            console.log("🎙️ Mic Started Successfully without repeating!");
        } catch (err) {
            console.error("❌ Mic failed to start:", err);
            setIsListening(false);
        }
    };
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // === 4. INITIAL QUESTION LOAD HOOK ===
    useEffect(() => {
        if (hrQuestionsList) {
            const parsed = hrQuestionsList
                .split(/\n/)
                .filter(line => /^\d+\./.test(line.trim()))
                .map(line => line.trim());

            setQuestions(parsed);

            if (parsed.length > 0) {
                setMessages([
                    {
                        sender: 'ai',
                        text: `Welcome to Phase 3: HR & Behavioral Round!\n\nI am your HR Director today. I will ask you situational questions based on your resume projects and experiences to evaluate your leadership and STAR articulation.\n\nHere is your first question:\n\n👉 **${parsed[0]}**`
                    }
                ]);
            }
        }
    }, [hrQuestionsList]);

    // === 5. AUTO-START MIC AFTER AI QUESTION ===
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.sender === 'ai' && currentIndex < questions.length && !loading) {
            let timer = 6;
            setCountdown(timer);

            const countdownInterval = setInterval(() => {
                timer -= 1;
                if (timer > 0) {
                    setCountdown(timer);
                } else {
                    clearInterval(countdownInterval);
                    setCountdown(null);
                    startVoiceRecognition();
                }
            }, 1000);

            return () => clearInterval(countdownInterval);
        }
    }, [messages, loading]);

    // === 6. GLOBAL ENTER KEY LISTENER ===
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey && userInput.trim() && !loading && !isListening) {
                e.preventDefault();
                handleSendMessage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [userInput, loading, isListening]);


    // Database save helper
    const saveInterviewToDB = async (finalTechScore, finalHrScore, totalScore, verdict) => {
        if (hasSavedRef.current) return; 
        hasSavedRef.current = true;
        try {
            const token = localStorage.getItem('token');
            // Ensure payload matches the TestHistory schema created in the Node.js backend
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/tests`, {
                role: "Software Engineer", // Defaulting role as it's required by our new schema
                score: totalScore,
                feedback: verdict,
                interviewType: "HR_AND_TECH_FINAL",
                // Keeping original fields to ensure frontend table mapping doesn't break
                techScore: finalTechScore,
                hrScore: finalHrScore,
                finalScore: totalScore,
                verdict: verdict,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("✅ Data Saved to Dashboard!");
        } catch (error) {
            console.error("⚠️ Error saving data:", error);
        }
    };

    // 🗑️ Clear Input Function
    const handleClearInput = () => {
        isIntentionallyStoppedRef.current = true;
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (err) { }
        }
        setIsListening(false);
        setCountdown(null);
        setUserInput('');
    };


    // =========================================================================
    // 🔥 MASTER CORE LOGIC: Q1 TO Q9 ZERO-LATENCY, Q10 BATCH API CALL
    // =========================================================================
    const processAnswerAndMoveForward = async (answerText, isSkipped) => {
        if (!answerText.trim() && !isSkipped) return;

        // 1. Force kill mic immediately
        isIntentionallyStoppedRef.current = true;
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (err) { }
        }
        setIsListening(false);
        setCountdown(null);

        setServerBusyError(false);
        setLoading(true);

        const currentQText = questions[currentIndex];
        const nextIndex = currentIndex + 1;
        const isLastQuestion = nextIndex >= questions.length;

        // 2. Add answer to local UI messages
        const displayAnswer = isSkipped ? "⏭️ *Skipped this question*" : answerText;
        const updatedMessages = [...messages, { sender: 'user', text: displayAnswer }];
        setMessages(updatedMessages);
        setUserInput('');

        // 3. Prepare QA Pair for Backend Bundle
        const newQaPair = {
            questionNumber: currentIndex + 1,
            questionText: currentQText,
            userAnswer: isSkipped ? "SKIPPED_BY_CANDIDATE" : answerText,
            isSkipped: isSkipped,
            feedback: "Pending evaluation..."
        };

        const updatedQaHistory = [...qaHistory, newQaPair];
        setQaHistory(updatedQaHistory);
        saveCurrentSession(updatedMessages, nextIndex, updatedQaHistory);

        // 4. CHECK: Agar Q1 se Q9 hai, toh BINA API call kiye turant agla sawaal dikhao (0ms latency!)
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

        // 5. FINAL QUESTION: Ab hum HR Batch Endpoint par poora bundle bhejenge!
        setMessages([
            ...updatedMessages,
            { sender: 'ai', text: "🤖 **HR Round Completed!** AI HR Director is analyzing your complete transcript across all questions. Creating your Final Verdict Report... Please wait." }
        ]);

        try {
            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('userEmail') || "test@user.com";

            // 🔥 HIT HR BATCH EVALUATE ENDPOINT:
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/chat/hr`, {
                userEmail: userEmail,
                qaList: updatedQaHistory
            }, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            });

            console.log("🎉 HR Batch Evaluation Report Received:", res.data);

            if (res.data) {
                setHrScoreHistory([res.data]);

                // 🔥 Enriched qaHistory mapping with questionWiseFeedback (0 Extra API calls!)
                if (res.data.questionWiseFeedback && Array.isArray(res.data.questionWiseFeedback)) {
                    const enrichedHistory = updatedQaHistory.map((item) => {
                        const matchedFeedback = res.data.questionWiseFeedback.find(
                            (f) => Number(f.questionNumber) === Number(item.questionNumber)
                        );
                        return {
                            ...item,
                            feedback: matchedFeedback ? matchedFeedback.feedback : "Behavioral assessment completed."
                        };
                    });
                    setQaHistory(enrichedHistory);
                }
            }

            // Save to analytics DB
            saveInterviewToDB(techPercentage, res.data?.overallCommunicationScore || 80, res.data?.overallTechnicalScore || 80, res.data?.finalVerdict || "Completed");

            setCurrentIndex(nextIndex);
            setIsVerdictModalOpen(true);

        } catch (err) {
            console.error("❌ HR Batch Evaluation Failed:", err);
            setServerBusyError(true);
            setCurrentIndex(nextIndex);
            setIsVerdictModalOpen(true); // Fallback modal open
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

    const renderMessageContent = (msgText) => {
        if (typeof msgText === 'object' && msgText !== null) {
            return (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 pt-1">
                        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2.5 py-1 rounded-lg text-xs font-bold">
                            🗣️ Comm: {msgText.overallCommunicationScore || 0}/100
                        </span>
                        <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2.5 py-1 rounded-lg text-xs font-bold">
                            👑 Leadership Alignment: {msgText.overallTechnicalScore || 0}/100
                        </span>
                        <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2.5 py-1 rounded-lg text-xs font-bold">
                            🌟 STAR Rating: {msgText.starScore || 0}/100
                        </span>
                    </div>

                    <div className="text-gray-200 text-sm leading-relaxed bg-black/20 p-3 rounded-xl border border-gray-700/50">
                        <strong className="text-green-400 block mb-1">👔 HR Director Feedback:</strong>
                        {msgText.overallFeedback}
                    </div>
                </div>
            );
        }
        return <div className="whitespace-pre-line">{String(msgText)}</div>;
    };

    // 🔥 HR BUG 1 FIX: Clean retry function for HR Round
    const handleRetryEvaluation = async () => {
        setServerBusyError(false);
        setLoading(true);
        setMessages(prev => [...prev, { sender: 'ai', text: "🔄 Retrying final HR batch evaluation with existing transcript..." }]);

        try {
            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('userEmail') || "test@user.com";

            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/chat/hr`, {
                userEmail: userEmail,
                qaList: qaHistory
            }, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            });

            if (res.data) {
                setHrScoreHistory([res.data]);

                // Enriched mapping on retry as well
                if (res.data.questionWiseFeedback && Array.isArray(res.data.questionWiseFeedback)) {
                    const enrichedHistory = qaHistory.map((item) => {
                        const matchedFeedback = res.data.questionWiseFeedback.find(
                            (f) => Number(f.questionNumber) === Number(item.questionNumber)
                        );
                        return {
                            ...item,
                            feedback: matchedFeedback ? matchedFeedback.feedback : "Behavioral assessment completed."
                        };
                    });
                    setQaHistory(enrichedHistory);
                }
            }
            setIsVerdictModalOpen(true);
        } catch (err) {
            console.error("❌ HR Retry Failed:", err);
            setServerBusyError(true);
        } finally {
            setLoading(false);
        }
    };

    // 💾 Session Save Helper
    const saveCurrentSession = (chatHistory, questionCount, currentQaHistory) => {
        const sessionData = {
            chatHistory: chatHistory,
            questionCount: questionCount,
            qaHistory: currentQaHistory, // 🔥 QA History save karne ke liye
            timestamp: Date.now(),
        };
        localStorage.setItem("activeHrInterviewSession", JSON.stringify(sessionData));
    };

    // 🔄 Page Load par check karne ke liye (useEffect ke andar daal dena ya alag se)
    useEffect(() => {
        const saved = localStorage.getItem("activeHrInterviewSession");
        if (saved) {
            const parsed = JSON.parse(saved);
            const timePassed = Date.now() - parsed.timestamp;
            const fifteenMinutes = 15 * 60 * 1000;

            if (timePassed <= fifteenMinutes) {
                setSavedSessionData(parsed);
                setShowResumeBanner(true);
            } else {
                localStorage.removeItem("activeHrInterviewSession");
            }
        }
    }, []);

    const handleResumeInterview = () => {
        if (savedSessionData) {
            setMessages(savedSessionData.chatHistory);
            setCurrentIndex(savedSessionData.questionCount);
            if (savedSessionData.qaHistory) {
                setQaHistory(savedSessionData.qaHistory); // 🔥 QA History restore karne ke liye
            }
            setShowResumeBanner(false);
            alert("🎉 HR Interview Resumed! Wahi se continue karo jahan chhoda tha.");
        }
    };

    return (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl shadow-2xl flex flex-col h-[600px] mt-8 relative z-20">

            {/* Header */}
            <div className="bg-[#262626] p-4 rounded-t-2xl border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                        <h3 className="font-bold text-gray-200 text-sm">Live HR & Behavioral Round (Phase 3)</h3>
                        <p className="text-[10px] text-gray-400">⚡ 2 AI Calls Architecture (Zero-Latency Transitions)</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {hrScoreHistory.length > 0 && (
                        <button
                            onClick={() => setIsVerdictModalOpen(true)}
                            className="text-[11px] bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-lg font-bold transition"
                        >
                            🏆 Final Verdict
                        </button>
                    )}
                    <span className="text-xs bg-gray-800 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 font-mono">
                        Question {Math.min(currentIndex + 1, questions.length)} / {questions.length}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                            ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-br-none shadow-lg'
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
                        <h4 className="text-xs font-mono uppercase tracking-wider text-blue-400">📋 Complete Transcript & Question Feedback:</h4>
                        {qaHistory.map((item, idx) => (
                            <div key={idx} className="bg-[#1f1f1f] border border-gray-800 p-3.5 rounded-xl space-y-1.5">
                                <p className="text-xs font-bold text-white">Q{item.questionNumber}: {item.questionText}</p>
                                <p className="text-xs text-gray-300">
                                    <strong className="text-blue-400">Your Answer:</strong> {item.userAnswer}
                                </p>
                                <p className="text-xs text-green-400 pt-1">
                                    💡 Feedback: {item.feedback || "Behavioral assessment completed."}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-[#262626] border border-gray-700 text-blue-400 p-4 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 animate-pulse">
                            👔 HR Director is analyzing your complete interview transcript...
                        </div>
                    </div>
                )}

                {serverBusyError && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl text-xs text-center flex flex-col items-center gap-2">
                        <span>⚠️ AI Server is temporarily busy. Click below to retry final evaluation!</span>
                        <button
                            onClick={handleRetryEvaluation}
                            className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg font-bold uppercase tracking-wide transition"
                        >
                            🔄 Retry Final Evaluation
                        </button>
                    </div>
                )}
            </div>

            {/* Smart Bottom Action Bar / Input */}
            {currentIndex >= questions.length ? (
                <div className="p-4 bg-[#262626] rounded-b-2xl border-t border-gray-700 flex justify-center items-center animate-fadeIn">
                    <button
                        onClick={() => setIsVerdictModalOpen(true)}
                        className="w-full bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-black py-3.5 px-8 rounded-xl transition duration-200 text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(34,197,94,0.4)]"
                    >
                        🏆 Re-open Grand Placement Verdict Report
                    </button>
                </div>
            ) : (
                <div className="p-4 bg-[#262626] rounded-b-2xl border-t border-gray-700 flex flex-col gap-2">

                    <div className="flex items-center justify-between px-1 text-xs">
                        {countdown !== null ? (
                            <span className="text-amber-400 font-bold animate-pulse flex items-center gap-1.5">
                                ⏱️ Get ready! Auto-enabling mic in <strong className="text-white text-sm">{countdown}s</strong>...
                            </span>
                        ) : isListening ? (
                            <span className="text-red-400 font-bold animate-pulse flex items-center gap-1.5">
                                🔴 Recording your voice... Speak clearly now!
                            </span>
                        ) : userInput.trim() ? (
                            <span className="text-green-400 font-extrabold animate-bounce flex items-center gap-1.5">
                                👉 Press <kbd className="bg-gray-800 border border-gray-600 px-1.5 py-0.5 rounded text-white font-mono">ENTER</kbd> key on your keyboard to submit!
                            </span>
                        ) : (
                            <span className="text-gray-400 italic">Click Speak button or wait for auto-mic to give your answer.</span>
                        )}

                        {userInput.trim() && !isListening && (
                            <span className="text-[10px] text-gray-500 font-mono">Voice Captured (Read-Only)</span>
                        )}
                        {/* 🟢 HR RESUME INTERVIEW FLOATING BANNER */}
                        {showResumeBanner && (
                            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-2xl bg-gray-900/90 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">⚡</span>
                                    <div>
                                        <h4 className="text-white font-bold text-sm sm:text-base">Unfinished HR Interview Detected!</h4>
                                        <p className="text-gray-400 text-xs">Aapka pichla HR session 15 minute ke andar ka hai. Wahi se shuru karein?</p>
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
                                            localStorage.removeItem("activeHrInterviewSession");
                                            setShowResumeBanner(false);
                                        }}
                                        className="bg-gray-800 text-gray-300 text-xs py-2 px-3 rounded-xl"
                                    >
                                        Start Fresh 🗑️
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                        <input
                            type="text"
                            value={userInput}
                            readOnly={true}
                            placeholder={
                                isListening
                                    ? "🎙️ Listening... Speak your answer now!"
                                    : "🔒 Voice-only input. Your spoken words will appear here..."
                            }
                            className="flex-1 bg-[#141414] border-2 border-gray-700/80 rounded-xl px-4 py-3 text-green-400 font-medium focus:outline-none focus:border-blue-500 text-sm opacity-90 cursor-not-allowed select-none shadow-inner"
                        />

                        <button
                            type="button"
                            onClick={startVoiceRecognition}
                            disabled={loading}
                            className={`px-4 py-3 rounded-xl font-bold text-sm transition duration-200 flex items-center justify-center gap-1.5 shrink-0 ${isListening
                                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)] border border-red-400'
                                : 'bg-[#1e1e1e] hover:bg-gray-700 text-gray-200 border border-gray-600 shadow-md'
                                }`}
                            title="Click to manually trigger mic"
                        >
                            {isListening ? '🛑 Listening...' : '🎙️ Speak'}
                        </button>

                        {/* 🗑️ Clear Button */}
                        {userInput.trim() && (
                            <button
                                type="button"
                                onClick={handleClearInput}
                                disabled={loading}
                                className="px-4 py-3 bg-red-900/40 hover:bg-red-600 text-red-300 hover:text-white border border-red-700/50 hover:border-red-500 font-bold rounded-xl transition duration-200 shadow-md flex items-center gap-2 shrink-0"
                                title="Clear mistake and record again"
                            >
                                🗑️ Clear
                            </button>
                        )}

                        {/* ⏭️ Skip Button */}
                        <button
                            type="button"
                            onClick={handleSkipQuestion}
                            disabled={loading}
                            className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition duration-200 shadow-md hover:shadow-amber-500/20 flex items-center gap-2"
                            title="Skip this question if you don't know the answer"
                        >
                            ⏭️ Skip
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !userInput.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3 rounded-xl transition duration-200 disabled:bg-gray-700 disabled:text-gray-500 text-sm uppercase tracking-wider shadow-lg shrink-0"
                        >
                            {loading ? '...' : 'Submit ↵'}
                        </button>
                    </form>

                </div>
            )}

            {/* The Grand Finale Modal */}
            {PlacementVerdictModal && (
                <PlacementVerdictModal
                    isOpen={isVerdictModalOpen}
                    onClose={() => setIsVerdictModalOpen(false)}
                    hrScoreHistory={hrScoreHistory}
                    techPercentage={techPercentage}
                />
            )}

        </div>
    );
};

export default HrInterviewChat;