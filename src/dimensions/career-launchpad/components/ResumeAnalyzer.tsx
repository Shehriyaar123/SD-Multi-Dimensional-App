import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, CheckCircle2, AlertCircle, BarChart3, Target } from 'lucide-react';
import { ResumeData, ResumeAnalysis } from '../types';
import { aiCareerService } from '../services/aiCareerService';

interface ResumeAnalyzerProps {
  resume: ResumeData;
}

export default function ResumeAnalyzer({ resume }: ResumeAnalyzerProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await aiCareerService.analyzeResume(resume, jobDescription);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Target Job Description</h3>
              <p className="text-xs text-zinc-500">Paste the job description you're applying for.</p>
            </div>
          </div>
          
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-orange-500 transition-all min-h-[300px] resize-none"
          />

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !jobDescription.trim()}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isAnalyzing ? "Analyzing with Gemini Pro..." : "Analyze Compatibility"}
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!analysis ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-zinc-800 rounded-3xl"
              >
                <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                  <BarChart3 className="w-10 h-10 text-zinc-700" />
                </div>
                <h4 className="text-xl font-bold text-zinc-400 mb-2">No Analysis Yet</h4>
                <p className="text-sm text-zinc-600 max-w-xs">Enter a job description to see how your resume stacks up against ATS filters.</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Score Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Match Score</p>
                    <p className={`text-4xl font-black ${analysis.score > 70 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {analysis.score}%
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-2">ATS Score</p>
                    <p className={`text-4xl font-black ${analysis.atsCompatibility.score > 80 ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {analysis.atsCompatibility.score}%
                    </p>
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-400" /> Missing Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Improvement Advice
                  </h4>
                  <div className="space-y-4">
                    {analysis.suggestions.map((s, i) => (
                      <div key={i} className="flex gap-3 text-sm text-zinc-300">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ATS Issues */}
                {analysis.atsCompatibility.issues.length > 0 && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" /> ATS Formatting Issues
                    </h4>
                    <div className="space-y-3">
                      {analysis.atsCompatibility.issues.map((issue, i) => (
                        <div key={i} className="text-sm text-zinc-400 flex gap-2">
                          <span className="text-orange-400">•</span> {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
