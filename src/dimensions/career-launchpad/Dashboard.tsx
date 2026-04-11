import React, { useState } from 'react';
import { ArrowLeft, Briefcase, Layout, Search, MessageSquare, Target, Sparkles, TrendingUp, Award, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from 'motion/react';
import ResumeArchitect from './components/ResumeArchitect';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import InterviewSimulator from './components/InterviewSimulator';
import CareerPathMapper from './components/CareerPathMapper';
import AICareerCoach from './components/AICareerCoach';
import { ResumeData } from './types';

type CareerTab = 'overview' | 'resume' | 'analyze' | 'interview' | 'path';

const initialResume: ResumeData = {
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '', summary: '' },
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

export default function CareerDashboard() {
  const [activeTab, setActiveTab] = useState<CareerTab>('overview');
  const [resume] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('penta_resume');
    return saved ? JSON.parse(saved) : initialResume;
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'resume', label: 'Resume Architect', icon: Layout },
    { id: 'interview', label: 'Mock Interview', icon: MessageSquare },
    { id: 'path', label: 'Career Mapper', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <nav className="relative z-10 mb-8 max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/select-dimension" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Ecosystem
        </Link>
        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CareerTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/20">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-display font-black tracking-tight">Career Command Center</h1>
                  <p className="text-zinc-400 mt-2 text-lg">Transform your raw experience into a professional-grade personal brand.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 group hover:border-orange-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-6">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Applications</h3>
                  <p className="text-4xl font-black text-white">12</p>
                  <p className="text-xs text-zinc-600 mt-4">+3 from last week</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 group hover:border-blue-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Interviews</h3>
                  <p className="text-4xl font-black text-white">4</p>
                  <p className="text-xs text-zinc-600 mt-4">Next: Tomorrow, 10 AM</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 group hover:border-emerald-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Offers</h3>
                  <p className="text-4xl font-black text-white">2</p>
                  <p className="text-xs text-zinc-600 mt-4">1 pending response</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 group hover:border-purple-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Network</h3>
                  <p className="text-4xl font-black text-white">156</p>
                  <p className="text-xs text-zinc-600 mt-4">12 new connections</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Recent Activity</h3>
                    <button className="text-sm text-orange-400 font-bold hover:text-orange-300 transition-colors">View All</button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { title: 'Resume Analyzed', detail: 'Match score: 85% for Google SDE', time: '2h ago', icon: Search, color: 'text-blue-400' },
                      { title: 'Mock Interview', detail: 'Completed session for Meta', time: '1d ago', icon: MessageSquare, color: 'text-orange-400' },
                      { title: 'New Skill Mapped', detail: 'Added "System Design" to path', time: '2d ago', icon: Target, color: 'text-indigo-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{item.title}</p>
                          <p className="text-xs text-zinc-500">{item.detail}</p>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <AICareerCoach resume={resume} />
              </div>
            </motion.div>
          )}

          {activeTab === 'resume' && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResumeArchitect />
            </motion.div>
          )}

          {activeTab === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InterviewSimulator />
            </motion.div>
          )}

          {activeTab === 'path' && (
            <motion.div
              key="path"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CareerPathMapper resume={resume} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
