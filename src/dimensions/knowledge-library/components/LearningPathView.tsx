import React from 'react';
import { 
  ArrowLeft, 
  Book, 
  Code, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  PlayCircle,
  Clock,
  Award,
  Share2,
  Bookmark
} from 'lucide-react';
import { motion } from 'motion/react';
import { LearningPath, LibraryResource } from '../types';
import { Problem } from '../../coding-platform/types';

interface LearningPathViewProps {
  path: LearningPath;
  resources: LibraryResource[];
  problems: Problem[];
  onBack: () => void;
  onSelectResource: (resource: LibraryResource) => void;
  onSelectProblem: (problem: Problem) => void;
}

const LearningPathView: React.FC<LearningPathViewProps> = ({ 
  path, 
  resources, 
  problems, 
  onBack, 
  onSelectResource, 
  onSelectProblem 
}) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-purple-600/10 to-[#050505]" />
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/learning/1920/1080')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-8 h-full flex flex-col justify-end pb-12">
          <button 
            onClick={onBack}
            className="absolute top-8 left-8 p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-full uppercase tracking-widest">
                  {path.domain}
                </span>
                <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 12h Estimated
                </span>
              </div>
              <h1 className="text-5xl font-black mb-4 tracking-tight">{path.title}</h1>
              <p className="text-gray-400 text-lg leading-relaxed">{path.description}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                <Bookmark className="w-6 h-6" />
              </button>
              <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                <Share2 className="w-6 h-6" />
              </button>
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Start Learning
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Path Roadmap */}
        <div className="lg:col-span-2 space-y-12">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-400" />
            Your Roadmap
          </h2>

          <div className="space-y-4 relative">
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-white/5" />
            
            {path.resources?.map((item, idx) => {
              const resource = resources.find(r => r.id === item.resourceId);
              if (!resource) return null;

              return (
                <motion.div 
                  key={resource.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => onSelectResource(resource)}
                  className="relative pl-16 group cursor-pointer"
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#050505] border-2 border-white/20 z-10 group-hover:border-blue-500 transition-all" />
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Book className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Step {idx + 1} • Resource</span>
                        </div>
                        <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{resource.title}</h3>
                        {item.notes && <p className="text-sm text-gray-500 mt-1">{item.notes}</p>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-all" />
                  </div>
                </motion.div>
              );
            })}

            {path.problems?.map((item, idx) => {
              const problem = problems.find(p => p.id === item.problemId);
              if (!problem) return null;

              return (
                <motion.div 
                  key={problem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (path.resources.length + idx) * 0.1 }}
                  onClick={() => onSelectProblem(problem)}
                  className="relative pl-16 group cursor-pointer"
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#050505] border-2 border-white/20 z-10 group-hover:border-emerald-500 transition-all" />
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Code className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Practice • {problem.difficulty}</span>
                        </div>
                        <h3 className="font-bold text-lg group-hover:text-emerald-400 transition-colors">{problem.title}</h3>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8">
            <h3 className="text-lg font-bold mb-6">Path Progress</h3>
            <div className="space-y-6">
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">33% Completed</span>
                <span className="font-bold text-blue-400">4 / 12 Steps</span>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">What you'll learn</h4>
              <ul className="space-y-4">
                {[
                  'Foundational concepts of the domain',
                  'Advanced problem-solving techniques',
                  'Real-world application and case studies',
                  'Industry best practices and standards'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 rounded-[32px] p-8">
            <h3 className="text-lg font-bold mb-4">Earn a Certificate</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Complete all resources and solve all practice problems to earn a verified certificate of completion.
            </p>
            <div className="w-full h-40 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center">
              <Award className="w-16 h-16 text-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathView;
