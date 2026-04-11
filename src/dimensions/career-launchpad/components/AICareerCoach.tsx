import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, TrendingUp, ArrowRight, Loader2, X } from 'lucide-react';
import { ResumeData } from '../types';
import { aiCareerService } from '../services/aiCareerService';

interface AICareerCoachProps {
  resume: ResumeData;
}

interface Advice {
  summary: string;
  actionItems: string[];
  marketOutlook: string;
}

export default function AICareerCoach({ resume }: AICareerCoachProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<Advice | null>(null);

  const getAdvice = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const data = await aiCareerService.getCareerAdvice(resume);
      setAdvice(data);
    } catch (error) {
      console.error("Failed to get advice", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/20 rounded-[40px] p-10 flex flex-col justify-center items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
          <Sparkles className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold">AI Career Coach</h3>
        <p className="text-zinc-400 leading-relaxed">
          {advice?.summary || '"Your resume is looking strong! Based on your recent coding activity, I recommend applying for the Full Stack role at Stripe. Your match score is 92%."'}
        </p>
        <button 
          onClick={getAdvice}
          disabled={loading}
          className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          Get Detailed Advice
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Personalized Career Strategy</h2>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">AI-Powered Insights</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    <p className="text-zinc-400 font-medium animate-pulse">Analyzing your profile and market trends...</p>
                  </div>
                ) : advice ? (
                  <>
                    <section className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Market Outlook
                      </h3>
                      <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
                        <p className="text-zinc-300 leading-relaxed italic">
                          "{advice.marketOutlook}"
                        </p>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Recommended Action Items
                      </h3>
                      <div className="space-y-3">
                        {advice.actionItems.map((item, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-orange-500/30 transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-xs font-bold">
                              {i + 1}
                            </div>
                            <p className="text-sm text-zinc-300 flex-1">{item}</p>
                            <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-500 transition-colors" />
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    <div className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-3xl">
                      <p className="text-xs text-zinc-500 text-center leading-relaxed">
                        This advice is generated based on your current resume data and real-time market analysis. 
                        Keep your resume updated for more accurate coaching.
                      </p>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="p-8 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
