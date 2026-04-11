import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Play, Square, MessageSquare, Sparkles, Star, TrendingUp, RefreshCw, ChevronRight } from 'lucide-react';
import { aiCareerService } from '../services/aiCareerService';
import { InterviewSession } from '../types';

export default function InterviewSimulator() {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startSession = async () => {
    if (!role || !company) return;
    setIsStarting(true);
    try {
      const questions = await aiCareerService.generateInterviewQuestions(role, company);
      setSession({
        id: Math.random().toString(36).substr(2, 9),
        role,
        company,
        questions,
        currentQuestionIndex: 0,
        responses: []
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsStarting(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const submitResponse = async () => {
    if (!session || !transcript.trim()) return;
    
    setIsEvaluating(true);
    const currentQuestion = session.questions[session.currentQuestionIndex];
    
    try {
      const evaluation = await aiCareerService.evaluateInterviewResponse(currentQuestion, transcript);
      
      const newResponse = {
        question: currentQuestion,
        answer: transcript,
        ...evaluation
      };

      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          responses: [...prev.responses, newResponse],
          currentQuestionIndex: prev.currentQuestionIndex + 1
        };
      });
      setTranscript('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto text-orange-400">
            <MessageSquare className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black">AI Mock Interview</h2>
            <p className="text-zinc-500">Practice with role-specific questions and get instant AI feedback.</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Target Role (e.g. Frontend Engineer)"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-orange-500 transition-all"
            />
            <input
              type="text"
              placeholder="Target Company (e.g. Google)"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>

          <button
            onClick={startSession}
            disabled={isStarting || !role || !company}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isStarting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            Start Mock Interview
          </button>
        </div>
      </div>
    );
  }

  const isFinished = session.currentQuestionIndex >= session.questions.length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interview Area */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {!isFinished ? (
              <motion.div
                key={session.currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Question {session.currentQuestionIndex + 1} of {session.questions.length}
                  </span>
                  <div className="flex gap-1">
                    {session.questions.map((_, i) => (
                      <div key={i} className={`w-8 h-1 rounded-full ${i <= session.currentQuestionIndex ? 'bg-orange-500' : 'bg-zinc-800'}`} />
                    ))}
                  </div>
                </div>

                <h3 className="text-2xl font-bold leading-tight">
                  {session.questions[session.currentQuestionIndex]}
                </h3>

                <div className="space-y-4">
                  <div className="min-h-[150px] bg-black/40 border border-zinc-800 rounded-2xl p-6 text-zinc-300 text-sm leading-relaxed italic">
                    {transcript || (isListening ? "Listening..." : "Click the mic and start speaking your answer...")}
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleListening}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${
                        isListening 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      {isListening ? "Stop Recording" : "Start Recording"}
                    </button>
                    
                    <button
                      onClick={submitResponse}
                      disabled={isListening || !transcript.trim() || isEvaluating}
                      className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isEvaluating ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      Submit Answer
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                  <Star className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black">Interview Complete!</h2>
                <p className="text-zinc-500">You've completed the mock interview for {session.role} at {session.company}. Review your feedback on the right.</p>
                <button 
                  onClick={() => setSession(null)}
                  className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-5 h-5" /> Start New Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feedback Sidebar */}
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar pr-2">
          <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Real-time Feedback
          </h4>
          
          <div className="space-y-4">
            {session.responses.length === 0 && (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-600 text-sm">
                Feedback will appear here after you submit your first answer.
              </div>
            )}
            {session.responses.map((resp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, starIdx) => (
                      <Star key={starIdx} className={`w-3 h-3 ${starIdx < resp.starScore ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                    {resp.sentiment}
                  </span>
                </div>
                <p className="text-xs font-bold text-zinc-300 line-clamp-2 italic">"{resp.question}"</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{resp.feedback}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
