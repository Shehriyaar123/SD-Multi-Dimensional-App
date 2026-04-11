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
  Trash2 
} from 'lucide-react';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { Problem, Difficulty } from '../types';
import { problemService } from '../services/problemService';

const AdminDashboard: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await problemService.deleteProblem(deleteId);
        setProblems(problems.filter(p => p.id !== deleteId));
      } catch (error) {
        console.error('Error deleting problem:', error);
      } finally {
        setDeleteId(null);
      }
    }
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search problems by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#141414] border border-white/5 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-white/5 rounded-xl hover:border-white/10 transition-all text-gray-400">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Problems List */}
        <ConfirmationModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Delete Problem"
          message="Are you sure you want to delete this problem? This action cannot be undone."
        />
        <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
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
                    <tr key={problem.id} className="hover:bg-white/[0.02] transition-colors group">
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
