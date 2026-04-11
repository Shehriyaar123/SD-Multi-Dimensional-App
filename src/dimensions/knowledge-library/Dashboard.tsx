import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Book, 
  FileText, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  ArrowRight,
  Bookmark,
  Clock,
  TrendingUp,
  Library as LibraryIcon,
  Globe,
  Database,
  Cpu,
  Calculator,
  FlaskConical,
  History,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { LibraryResource, LearningPath } from './types';
import { Problem } from '../coding-platform/types';
import { libraryService } from './services/libraryService';
import { externalLibraryService } from './services/externalLibraryService';
import { aiService } from '../coding-platform/services/aiService';
import { problemService } from '../coding-platform/services/problemService';
import ResourceReader from './components/ResourceReader';
import LearningPathView from './components/LearningPathView';
import { seedLibraryData } from './seed';

type ViewState = 'dashboard' | 'reader' | 'path';

export default function LibraryDashboard() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeDomain, setActiveDomain] = useState('All');
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const domains = [
    { name: 'All', icon: LibraryIcon },
    { name: 'Computer Science', icon: Cpu },
    { name: 'Mathematics', icon: Calculator },
    { name: 'Science', icon: FlaskConical },
    { name: 'Engineering', icon: Database },
    { name: 'Humanities', icon: Globe },
    { name: 'Business', icon: TrendingUp },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      let resData = await libraryService.getAllResources();
      let pathData = await libraryService.getAllPaths();
      
      if (resData.length === 0) {
        await seedLibraryData();
        resData = await libraryService.getAllResources();
        pathData = await libraryService.getAllPaths();
      }

      const probData = await problemService.getAllProblems();
      setResources(resData);
      setPaths(pathData);
      setProblems(probData);
    } catch (error) {
      console.error("Error loading library data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const semanticResults = await aiService.semanticSearch(searchQuery, resources);
      const [openLibrary, arxiv] = await Promise.all([
        externalLibraryService.searchOpenLibrary(searchQuery),
        externalLibraryService.searchArXiv(searchQuery)
      ]);
      setAiResults([...semanticResults, ...openLibrary, ...arxiv]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const openResource = (resource: LibraryResource) => {
    setSelectedResource(resource);
    setView('reader');
  };

  const openPath = (path: LearningPath) => {
    setSelectedPath(path);
    setView('path');
  };

  if (view === 'reader' && selectedResource) {
    return <ResourceReader resource={selectedResource} onBack={() => setView('dashboard')} />;
  }

  if (view === 'path' && selectedPath) {
    return (
      <LearningPathView 
        path={selectedPath} 
        resources={resources} 
        problems={problems}
        onBack={() => setView('dashboard')}
        onSelectResource={openResource}
        onSelectProblem={(p) => {
          // In a real app, we'd navigate to the coding platform's solver
          console.log("Navigating to problem:", p.id);
        }}
      />
    );
  }

  const filteredResources = activeDomain === 'All' 
    ? resources 
    : resources.filter(res => res.domain === activeDomain);

  const displayResources = aiResults.length > 0 ? aiResults : filteredResources;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto mb-8">
        <Link to="/select-dimension" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Ecosystem
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[40px] overflow-hidden bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-white/5 p-12 mb-12"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">AI-Powered Knowledge Hub</span>
            </div>
            <h1 className="text-5xl font-black mb-6 leading-tight bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              Discover the World's <br /> Knowledge in One Place
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Access millions of books, research papers, and documentation. 
              Enhanced with AI for summarization, semantic search, and personalized learning paths.
            </p>

            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for books, papers, or topics (e.g., 'Beginner graph algorithms')"
                className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-16 pr-32 focus:outline-none focus:border-indigo-500/50 transition-all text-lg backdrop-blur-xl"
              />
              <button 
                type="submit"
                disabled={isSearching}
                className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Ask AI
              </button>
            </form>
          </div>
        </motion.div>

        {/* Domain Filters */}
        <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
          {domains.map((domain) => (
            <button
              key={domain.name}
              onClick={() => setActiveDomain(domain.name)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all whitespace-nowrap font-bold text-sm ${
                activeDomain === domain.name 
                  ? 'bg-white text-black border-white' 
                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <domain.icon className="w-4 h-4" />
              {domain.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-12">
          {/* AI Results or Trending */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {aiResults.length > 0 ? <Sparkles className="w-6 h-6 text-indigo-400" /> : <TrendingUp className="w-6 h-6 text-emerald-400" />}
                {aiResults.length > 0 ? 'AI Search Results' : 'Trending Resources'}
              </h2>
              {aiResults.length > 0 && (
                <button onClick={() => setAiResults([])} className="text-sm text-gray-500 hover:text-white transition-colors">
                  Clear Results
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayResources?.map((res, idx) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => openResource(res)}
                  className="group bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all" />
                  <div className="flex gap-6 relative z-10">
                    <div className="w-24 h-32 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/5">
                      {res.thumbnail ? (
                        <img src={res.thumbnail} alt={res.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <Book className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          res.type === 'Book' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                          res.type === 'Paper' ? 'text-purple-400 border-purple-400/20 bg-purple-400/10' :
                          'text-emerald-400 border-emerald-400/20 bg-emerald-400/10'
                        }`}>
                          {res.type}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{res.source}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">{res.title}</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{res.description}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">{res.author}</span>
                        <button className="p-2 bg-white/5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Learning Paths */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Layers className="w-6 h-6 text-blue-400" />
                Curated Learning Paths
              </h2>
              <button className="text-sm text-blue-400 font-bold hover:text-blue-300 transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paths?.map((path) => (
                <div 
                  key={path.id} 
                  onClick={() => openPath(path)}
                  className="group bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all cursor-pointer"
                >
                  <div className="h-40 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6 flex items-end">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/10">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="p-6">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 block">{path.domain}</span>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors">{path.title}</h3>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2">{path.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
                      <span className="flex items-center gap-1.5"><Book className="w-3.5 h-3.5" /> {path.resources.length} Resources</span>
                      <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {path.problems.length} Problems</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          {/* Quick Stats / Activity */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-400" />
              Your Library
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Continue Reading</p>
                  <p className="text-xs text-gray-500">Clean Code - Chapter 4</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Recent Activity</p>
                  <p className="text-xs text-gray-500">Saved 3 papers on LLMs</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all">
              Manage Library
            </button>
          </div>

          {/* AI Insights */}
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[32px] p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-indigo-400">AI Daily Insight</h3>
            </div>
            <p className="text-sm text-indigo-200/70 leading-relaxed italic">
              "Based on your interest in Graph Algorithms, you might find the new paper on 'Dynamic Graph Neural Networks' fascinating. It bridges the gap between static analysis and real-time data."
            </p>
            <button className="mt-6 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
              Read Paper <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
