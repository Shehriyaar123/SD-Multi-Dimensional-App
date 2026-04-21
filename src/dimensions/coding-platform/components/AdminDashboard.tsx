import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Code2, 
  Plus, 
  Trophy, 
  Users, 
  ExternalLink, 
  Search, 
  Filter, 
  Edit2, 
  Trash2,
  Download,
  Database,
  Globe,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { Problem, Difficulty } from '../types';
import { problemService } from '../services/problemService';
import { scrapingService } from '../services/scrapingService';
import { motion, AnimatePresence } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showScraper, setShowScraper] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeLog, setScrapeLog] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null);
  const navigate = useNavigate();

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

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleScrape = async (source: 'codeforces' | 'github') => {
    setIsScraping(true);
    setScrapeLog(prev => [...prev, `Initiating data synchronization...`]);
    try {
      let rawProblems = [];
      if (source === 'codeforces') {
        setScrapeLog(prev => [...prev, `Accessing high-quality competitive programming problemset...`]);
        rawProblems = await scrapingService.scrapeCodeforces();
      } else {
        setScrapeLog(prev => [...prev, `Analyzing curated data structures and algorithms repository...`]);
        rawProblems = await scrapingService.scrapeGitHubDataset();
      }
      
      setScrapeLog(prev => [...prev, `Syncing ${rawProblems.length} records. Permanently copying unique challenges to your database...`]);
      const importedCount = await scrapingService.importProblems(rawProblems);
      
      setScrapeLog(prev => [...prev, `Success: ${importedCount} unique challenges have been saved to your local records.`]);
      if (importedCount > 0) loadProblems();
    } catch (err) {
      console.error('Scrape error:', err);
      setScrapeLog(prev => [...prev, `Notice: A technical issue occurred during synchronization.`]);
    } finally {
      setIsScraping(false);
    }
  };
  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await problemService.deleteProblem(deleteId);
        setProblems(problems.filter(p => p.id !== deleteId));
        setSelectedIds(prev => prev.filter(id => id !== deleteId));
      } catch (error) {
        console.error('Error deleting problem:', error);
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteMode) return;
    
    try {
      setLoading(true);
      if (bulkDeleteMode === 'all') {
        await problemService.deleteAllProblems();
        setProblems([]);
        setSelectedIds([]);
      } else {
        await problemService.deleteProblems(selectedIds);
        setProblems(problems.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('Failed to perform bulk deletion.');
    } finally {
      setLoading(false);
      setBulkDeleteMode(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProblems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProblems.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <Code2 className="w-8 h-8 text-blue-400" />
              Elite Coding Admin
            </h1>
            <p className="text-gray-400 mt-1">Manage competitive programming challenges and ecosystem.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowScraper(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl transition-all border border-indigo-600/20 font-medium"
            >
              <Globe className="w-4 h-4" />
              Scrape External
            </button>
            <Link 
              to="/coding/admin/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Problem
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Problems', value: problems.length, icon: Code2, color: 'text-blue-400' },
            { label: 'Active Contests', value: '0', icon: Trophy, color: 'text-amber-400' },
            { label: 'Total Users', value: '1.2k', icon: Users, color: 'text-emerald-400' },
            { label: 'Submissions', value: '45k', icon: ExternalLink, color: 'text-indigo-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#141414] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search problems by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#141414] border border-white/5 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            
            {selectedIds.length > 0 && (
              <button 
                onClick={() => setBulkDeleteMode('selected')}
                className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all font-bold text-xs uppercase"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete ({selectedIds.length})
              </button>
            )}

            <button 
              onClick={() => setBulkDeleteMode('all')}
              className="flex items-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-lg shadow-rose-600/20 font-bold text-xs uppercase"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete All
            </button>
          </div>
        </div>

        {/* Scraper Modal */}
        <AnimatePresence>
          {showScraper && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#141414] border border-white/10 rounded-[32px] p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Legal DSA Scraper</h3>
                      <p className="text-sm text-gray-500">Fetch problems from official APIs and open source datasets.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowScraper(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleScrape('codeforces')}
                    disabled={isScraping}
                    className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                        <Globe className="w-5 h-5" />
                      </div>
                      <span className="font-bold">CP Problemset</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">External competitive programming problemset. Imports metadata and rating-based rankings.</p>
                  </button>

                  <button 
                    onClick={() => handleScrape('github')}
                    disabled={isScraping}
                    className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                        <Database className="w-5 h-5" />
                      </div>
                      <span className="font-bold">DSA Repository</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">Curated algorithmic JSON from open-source educational repositories.</p>
                  </button>
                </div>

                <div className="flex-1 min-h-[200px] bg-black/40 rounded-2xl p-6 font-mono text-[11px] overflow-y-auto space-y-2 border border-white/5 relative">
                  {scrapeLog.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
                      <AlertTriangle className="w-8 h-8 opacity-20 mb-2" />
                      <p>Select a source to begin legal import</p>
                    </div>
                  )}
                  {scrapeLog.map((log, i) => (
                    <div key={i} className="flex gap-3 text-gray-400">
                      <span className="text-gray-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                      <span className={log.includes('Successfully') ? 'text-emerald-400' : log.includes('Error') ? 'text-rose-400' : ''}>
                        {log}
                      </span>
                    </div>
                  ))}
                  {isScraping && (
                    <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-bold text-orange-400 uppercase tracking-widest block mb-1">Legal Notice</span>
                    This tool strictly uses public APIs and authorized datasets. Scraped data is for educational use. Please ensure compliance with the target website's Terms of Service (ToS).
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Problems List */}
        <ConfirmationModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Delete Problem"
          message="Are you sure you want to delete this problem? This action cannot be undone."
        />
        <ConfirmationModal
          isOpen={!!bulkDeleteMode}
          onClose={() => setBulkDeleteMode(null)}
          onConfirm={handleBulkDelete}
          title={bulkDeleteMode === 'all' ? "Delete All Problems" : "Delete Selected Problems"}
          message={bulkDeleteMode === 'all' 
            ? "Are you SURE you want to delete ALL problems? This will permanently wipe your entire challenge database." 
            : `Are you sure you want to delete the ${selectedIds.length} selected problems?`}
        />
        <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      onChange={toggleSelectAll}
                      checked={filteredProblems.length > 0 && selectedIds.length === filteredProblems.length}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-0 focus:ring-offset-0"
                    />
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Problem</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Difficulty</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Category</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Submissions</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Loading problems...
                      </div>
                    </td>
                  </tr>
                ) : filteredProblems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No problems found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProblems.map((problem) => (
                    <tr key={problem.id} className={`hover:bg-white/[0.02] transition-colors group ${selectedIds.includes(problem.id) ? 'bg-blue-500/[0.03]' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(problem.id)}
                          onChange={() => toggleSelect(problem.id)}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-0 focus:ring-offset-0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Code2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-blue-400 transition-colors">{problem.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {problem.tags.slice(0, 2).map((tag, idx) => (
                                <span key={`${tag}-${idx}`} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 uppercase tracking-wider">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {problem.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        0
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/coding/admin/edit/${problem.id}`)}
                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-blue-400 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(problem.id)}
                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-rose-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
