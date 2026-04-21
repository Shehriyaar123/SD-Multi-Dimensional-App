import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Send, 
  Settings, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Maximize2,
  BookOpen,
  MessageSquare,
  History,
  Terminal,
  Loader2,
  Braces,
  Lightbulb,
  Eye,
  Sparkles,
  Info
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Problem, TestCase } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { aiService } from '../services/aiService';
import { auth } from '../../../firebase';
import { submissionService } from '../services/submissionService';
import { Submission } from '../types';

interface ProblemSolverProps {
  problem: Problem;
  onBack: () => void;
}

const ProblemSolver: React.FC<ProblemSolverProps> = ({ problem, onBack }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'submissions' | 'solution'>('description');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const languages = [
    { id: 'javascript', name: 'JavaScript', monaco: 'javascript' },
    { id: 'python', name: 'Python', monaco: 'python' },
    { id: 'cpp', name: 'C++', monaco: 'cpp' },
    { id: 'java', name: 'Java', monaco: 'java' },
    { id: 'go', name: 'Go', monaco: 'go' },
    { id: 'rust', name: 'Rust', monaco: 'rust' },
    { id: 'kotlin', name: 'Kotlin', monaco: 'kotlin' },
    { id: 'swift', name: 'Swift', monaco: 'swift' },
  ];

  useEffect(() => {
    const template = problem.codeTemplates?.find(t => t.language === language)?.template;
    if (template) {
      setCode(template);
    } else {
      switch (language) {
        case 'javascript': setCode('// Write your solution here\nfunction solve() {\n\n}'); break;
        case 'python': setCode('# Write your solution here\ndef solve():\n    pass'); break;
        case 'cpp': setCode('#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}'); break;
        case 'java': setCode('public class Solution {\n    public static void main(String[] args) {\n\n    }\n}'); break;
        default: setCode('// Start coding...');
      }
    }
  }, [language, problem.codeTemplates]);

  const handleRun = async () => {
    setIsRunning(true);
    setConsoleOutput(['Compiling...', 'Running test cases...']);
    
    setTimeout(() => {
      setConsoleOutput(prev => [...prev, 'Output: ' + problem.sampleOutput, 'Execution finished.']);
      setIsRunning(false);
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      alert("Please sign in to submit your solution.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate grading delay
    setTimeout(async () => {
      const status = 'Accepted'; // In a real app, this would be determined by a grading engine
      const passed = problem.testCases.length;
      const total = problem.testCases.length;
      
      const resultData = {
        status: status as any,
        runtime: Math.floor(Math.random() * 50) + 10,
        memory: Math.floor(Math.random() * 20) + 5,
        passed,
        total
      };

      setResults(resultData);

      try {
        await submissionService.createSubmission({
          problemId: problem.id,
          userId: auth.currentUser!.uid,
          language,
          code,
          status: status as any,
          runtime: resultData.runtime,
          memory: resultData.memory,
          testCasesPassed: passed,
          totalTestCases: total
        });
      } catch (error) {
        console.error("Failed to save submission:", error);
      }

      setIsSubmitting(false);
    }, 2000);
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    try {
      const aiHint = await aiService.getHint(problem.statement, code, language);
      setHint(aiHint);
    } catch (error) {
      console.error("Error getting hint:", error);
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col bg-[#050505]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <h2 className="font-bold text-sm truncate max-w-[200px] bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {problem.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleGetHint}
            disabled={hintLoading}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-600/20 disabled:opacity-50"
          >
            {hintLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Get Hint
          </button>
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-none rounded-lg px-3 py-1 text-xs font-bold focus:outline-none cursor-pointer hover:bg-white/5 transition-all text-white"
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.id} className="bg-[#141414]">{lang.name}</option>
              ))}
            </select>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-xl text-gray-400">
            <Settings className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button 
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all disabled:opacity-50 border border-white/5"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-6 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Description */}
        <div className="w-1/2 flex flex-col border-r border-white/5 bg-[#080808]">
          <div className="flex border-b border-white/5 px-4 bg-black/20">
            {[
              { id: 'description', label: 'Description', icon: BookOpen },
              { id: 'editorial', label: 'Editorial', icon: Lightbulb },
              { id: 'solution', label: 'Solution', icon: Eye },
              { id: 'submissions', label: 'Submissions', icon: History },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-4 text-xs font-bold transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {hint && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex gap-4 relative group"
                >
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="text-sm text-indigo-200 leading-relaxed">
                    <span className="font-bold text-indigo-400 block mb-1">AI Mentor Hint</span>
                    {hint}
                  </div>
                  <button 
                    onClick={() => setHint(null)}
                    className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <XCircle className="w-4 h-4 text-gray-500" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {activeTab === 'description' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight">{problem.title}</h1>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                      problem.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                      problem.difficulty === 'Medium' ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' :
                      'text-rose-400 border-rose-400/20 bg-rose-400/10'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className="text-[10px] px-2.5 py-1 bg-white/5 text-gray-400 rounded-lg uppercase tracking-widest font-bold border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {problem.statement}
                  </ReactMarkdown>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" /> Constraints
                  </h3>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {problem.constraints}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sample Input</h3>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-5 font-mono text-xs text-blue-400 whitespace-pre-wrap">
                      {problem.sampleInput}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sample Output</h3>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-5 font-mono text-xs text-emerald-400 whitespace-pre-wrap">
                      {problem.sampleOutput}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editorial' && (
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex gap-4">
                  <Lightbulb className="w-6 h-6 text-blue-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-blue-400">Editorial Analysis</h4>
                    <p className="text-sm text-gray-400 mt-1">Deep dive into the problem logic and complexity.</p>
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {problem.editorial || "No editorial available for this problem yet."}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === 'solution' && (
              <div className="space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex gap-4">
                  <Eye className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-400">Reference Solution</h4>
                    <p className="text-sm text-gray-400 mt-1">A working solution for reference.</p>
                  </div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                  {problem.referenceSolution || "No reference solution available yet."}
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="text-center py-32 text-gray-500">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <History className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-medium">No submissions yet.</p>
                <p className="text-sm mt-1">Submit your code to see your history here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Editor & Console */}
        <div className="w-1/2 flex flex-col bg-[#0a0a0a]">
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage={language}
              language={languages.find(l => l.id === language)?.monaco || language}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 20 },
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
              }}
            />
          </div>

          {/* Console / Results */}
          <div className="h-[35%] border-t border-white/5 flex flex-col bg-black/60 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <Terminal className="w-3.5 h-3.5" /> Console
              </div>
              <button 
                onClick={() => setConsoleOutput([])}
                className="text-[10px] text-gray-500 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 font-mono text-xs space-y-2 custom-scrollbar">
              {consoleOutput.map((line, i) => (
                <div key={i} className="text-gray-400 flex gap-3">
                  <span className="text-gray-600 font-bold">[{i + 1}]</span>
                  {line}
                </div>
              ))}
              {results && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-4 p-6 rounded-2xl border ${
                    results.status === 'Accepted' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        results.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                      }`}>
                        {results.status === 'Accepted' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      </div>
                      <div>
                        <span className={`font-bold text-xl ${results.status === 'Accepted' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {results.status}
                        </span>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                          {results.passed} / {results.total} Test Cases Passed
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Runtime</p>
                      <p className="text-lg font-bold text-blue-400 mt-1">{results.runtime} ms</p>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Memory</p>
                      <p className="text-lg font-bold text-purple-400 mt-1">{results.memory} MB</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {consoleOutput.length === 0 && !results && (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                  <Play className="w-8 h-8 opacity-10" />
                  <p className="text-sm italic">Run your code to see output here...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemSolver;
