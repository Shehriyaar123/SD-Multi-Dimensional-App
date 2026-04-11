import React, { useState, useEffect } from "react";
import { ArrowLeft, Code, LayoutDashboard, User, Plus } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AdminDashboard from "../coding-platform/components/AdminDashboard";
import UserProblemList from "../coding-platform/components/UserProblemList";
import ProblemForm from "../coding-platform/components/ProblemForm";
import { problemService } from "../coding-platform/services/problemService";
import { Problem } from "../coding-platform/types";

interface CodingDashboardProps {
  initialView?: 'user' | 'admin' | 'admin-create' | 'admin-edit';
}

export default function CodingDashboard({ initialView = 'user' }: CodingDashboardProps) {
  const [view, setView] = useState(initialView);
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  useEffect(() => {
    setView(initialView);
    if (initialView === 'admin-edit' && id) {
      loadProblem(id);
    } else if (initialView !== 'admin-edit') {
      setEditingProblem(null);
    }
  }, [initialView, id]);

  const loadProblem = async (problemId: string) => {
    const problem = await problemService.getProblemById(problemId);
    if (problem) {
      setEditingProblem(problem);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/select-dimension" className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Elite Coding Arena</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => navigate('/coding')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'user' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Arena
          </button>
          <button 
            onClick={() => navigate('/coding/admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'admin' || view === 'admin-create' || view === 'admin-edit' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Admin
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 overflow-y-auto">
        {view === 'admin' && <AdminDashboard />}
        {view === 'user' && <UserProblemList />}
        {(view === 'admin-create' || view === 'admin-edit') && (
          <ProblemForm 
            problem={editingProblem} 
            onClose={() => navigate('/coding/admin')} 
            onSuccess={() => navigate('/coding/admin')}
          />
        )}
      </main>
    </div>
  );
}
