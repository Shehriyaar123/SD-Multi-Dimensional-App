import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Sparkles, Linkedin, CheckCircle2, ArrowRight, GraduationCap, Briefcase, ExternalLink } from 'lucide-react';
import { ResumeData } from '../types';
import { aiCareerService } from '../services/aiCareerService';

interface CareerPathMapperProps {
  resume: ResumeData;
}

export default function CareerPathMapper({ resume }: CareerPathMapperProps) {
  const [targetRole, setTargetRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<{ missingSkills: string[], recommendedCertifications: string[], suggestedProjects: string[] } | null>(null);
  const [linkedIn, setLinkedIn] = useState<{ headline: string, about: string } | null>(null);

  const handleAnalyze = async () => {
    if (!targetRole.trim()) return;
    setIsAnalyzing(true);
    try {
      const [gap, li] = await Promise.all([
        aiCareerService.skillGapAnalysis(resume, targetRole),
        aiCareerService.optimizeLinkedIn(resume)
      ]);
      setGapAnalysis(gap);
      setLinkedIn(li);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Input Section */}
      <div className="max-w-3xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-12 text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-400">
          <Target className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black">Career Path Mapper</h2>
          <p className="text-zinc-500">Define your dream role and let AI map your journey to success.</p>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="What is your dream role? (e.g. Senior Product Manager)"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500 transition-all"
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !targetRole.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl px-8 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            Map My Path
          </button>
        </div>
      </div>

      <AnimatePresence>
        {gapAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Skill Gap Analysis */}
            <div className="space-y-8">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-orange-400" /> Skill Gap Analysis
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Skills to Master</p>
                    <div className="flex flex-wrap gap-2">
                      {gapAnalysis.missingSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-xs font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Recommended Certifications</p>
                    <div className="space-y-2">
                      {gapAnalysis.recommendedCertifications.map((cert, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-zinc-300 bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-blue-400" /> Suggested Projects
                </h3>
                <div className="space-y-4">
                  {gapAnalysis.suggestedProjects.map((proj, i) => (
                    <div key={i} className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl group hover:border-blue-500/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-zinc-200">{proj}</h4>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-all" />
                      </div>
                      <p className="text-xs text-zinc-500">Demonstrate your expertise by building this project for your portfolio.</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LinkedIn Optimizer */}
            <div className="space-y-8">
              <div className="bg-[#0077b5]/10 border border-[#0077b5]/20 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3 text-[#0077b5]">
                    <Linkedin className="w-6 h-6" /> LinkedIn Optimizer
                  </h3>
                  <button className="p-2 bg-[#0077b5]/10 text-[#0077b5] rounded-xl hover:bg-[#0077b5]/20 transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Suggested Headline</p>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-zinc-200 font-bold leading-relaxed">
                      {linkedIn?.headline}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Optimized 'About' Section</p>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-sm text-zinc-400 leading-relaxed italic">
                      {linkedIn?.about}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-8 text-center">
                <h3 className="text-lg font-bold mb-2">Ready to Apply?</h3>
                <p className="text-sm text-zinc-500 mb-6">Your personal brand is now optimized for the 5th dimension.</p>
                <div className="flex justify-center gap-4">
                  <button className="px-6 py-3 bg-white text-black font-bold rounded-xl text-sm transition-all hover:scale-105">
                    View Job Board
                  </button>
                  <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-all">
                    Share Profile
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
