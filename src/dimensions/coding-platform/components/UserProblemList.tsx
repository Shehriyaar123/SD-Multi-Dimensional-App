import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trophy, 
  Code2, 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  Clock,
  Filter,
  ArrowUpRight,
  Zap,
  ChevronDown,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { problemService } from '../services/problemService';
import { Problem, Difficulty } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ProblemSolver from './ProblemSolver';

const UserProblemList: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isDiffDropdownOpen, setIsDiffDropdownOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await problemService.getAllProblems();
      setProblems(data);
    } catch (error) {
      console.error('Error loading problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10';
      case 'Medium': return 'text-amber-400 bg-amber-400/10';
      case 'Hard': return 'text-rose-400 bg-rose-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const categories = ['All', ...Array.from(new Set(problems.map(p => p.category)))];

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesDiff && matchesCat;
  });

  if (selectedProblem) {
    return <ProblemSolver problem={selectedProblem} onBack={() => setSelectedProblem(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2.5rem] overflow-hidden bg-[#111] border border-white/5 p-8 md:p-16"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/5 blur-[100px] rounded-full -ml-20 -mb-20" />
          
          <div className="relative z-10 space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-[0.2em]">
              <Zap className="w-3.5 h-3.5 fill-current" /> Elite Ecosystem
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              PUSH YOUR <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                LIMITS.
              </span>
            </h2>
            <p className="text-gray-400 text-xl leading-relaxed max-w-xl">
              Master complex algorithms, dominate global leaderboards, and architect the future of technology.
            </p>
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold">1,240</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Rank</span>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold">45</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Solved</span>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold">12</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contests</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#141414] border border-white/5 p-4 rounded-3xl shadow-2xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search challenges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-transparent rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.07] transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Difficulty Dropdown */}
            <div className="relative w-full md:w-40">
              <button 
                onClick={() => { setIsDiffDropdownOpen(!isDiffDropdownOpen); setIsCatDropdownOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-medium hover:bg-white/10 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-blue-400" />
                  {difficultyFilter}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDiffDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isDiffDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                  >
                    {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
                      <button
                        key={diff}
                        onClick={() => { setDifficultyFilter(diff); setIsDiffDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                      >
                        {diff}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Category Dropdown */}
            <div className="relative w-full md:w-48">
              <button 
                onClick={() => { setIsCatDropdownOpen(!isCatDropdownOpen); setIsDiffDropdownOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-medium hover:bg-white/10 transition-all"
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
                  {categoryFilter}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isCatDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-60 overflow-y-auto"
                  >
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setCategoryFilter(cat); setIsCatDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-purple-500/10 hover:text-purple-400 transition-all"
                      >
                        {cat}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Problem Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 space-y-4 animate-pulse">
                <div className="w-12 h-12 bg-white/5 rounded-2xl" />
                <div className="h-6 bg-white/5 rounded-lg w-3/4" />
                <div className="h-4 bg-white/5 rounded-lg w-1/2" />
              </div>
            ))
          ) : filteredProblems.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-white/5 rounded-[2.5rem]">
              No challenges found matching your criteria.
            </div>
          ) : (
            filteredProblems.map((problem, i) => (
              <motion.div 
                key={problem.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedProblem(problem)}
                className="group relative bg-[#141414] border border-white/5 rounded-[2rem] p-8 hover:border-blue-500/30 hover:bg-blue-500/[0.02] cursor-pointer transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all" />
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                      <Code2 className="w-7 h-7 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-2xl font-bold group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                      {problem.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-2 font-medium">{problem.category}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 15m</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 85%</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProblemList;
