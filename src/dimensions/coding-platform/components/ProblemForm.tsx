import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Plus, 
  Trash2, 
  Eye, 
  Code, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Braces,
  Lightbulb,
  Info
} from 'lucide-react';
import { Problem, TestCase, Difficulty, CodeTemplate } from '../types';
import { problemService } from '../services/problemService';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ProblemFormProps {
  problem: Problem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'cpp', name: 'C++' },
  { id: 'java', name: 'Java' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'swift', name: 'Swift' },
];

const ProblemForm: React.FC<ProblemFormProps> = ({ problem, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiUserPrompt, setAiUserPrompt] = useState('');
  const [generationSteps, setGenerationSteps] = useState([
    { id: 'duplicates', label: 'Filtering existing problems', status: 'pending' },
    { id: 'concept', label: 'Conceptualizing challenge', status: 'pending' },
    { id: 'statement', label: 'Generating statement', status: 'pending' },
    { id: 'testcases', label: 'Designing test cases', status: 'pending' },
    { id: 'solution', label: 'Creating reference code', status: 'pending' },
    { id: 'finalizing', label: 'Polishing editorial', status: 'pending' },
  ]);
  const [moreTestCasesLoading, setMoreTestCasesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'testcases' | 'editorial' | 'solutions' | 'templates'>('details');
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState<Omit<Problem, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>>({
    title: '',
    slug: '',
    difficulty: 'Easy',
    category: 'Algorithms',
    tags: [],
    statement: '',
    constraints: '',
    inputFormat: '',
    outputFormat: '',
    sampleInput: '',
    sampleOutput: '',
    testCases: [],
    editorial: '',
    referenceSolution: '',
    codeTemplates: []
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (problem) {
      setFormData({
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        category: problem.category,
        tags: problem.tags,
        statement: problem.statement,
        constraints: problem.constraints,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        sampleInput: problem.sampleInput,
        sampleOutput: problem.sampleOutput,
        testCases: problem.testCases,
        editorial: problem.editorial || '',
        referenceSolution: problem.referenceSolution || '',
        codeTemplates: problem.codeTemplates || []
      });
    }
  }, [problem]);

  const handleSave = async () => {
    if (!formData.title || !formData.statement) {
      alert('Please fill in the title and problem statement.');
      return;
    }

    setLoading(true);
    try {
      if (problem) {
        await problemService.updateProblem(problem.id, formData);
      } else {
        await problemService.createProblem({
          ...formData,
          authorId: 'admin'
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving problem:', error);
      alert('Failed to save problem.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    // Reset steps
    setGenerationSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
    
    const updateStep = (id: string, status: 'pending' | 'loading' | 'completed' | 'error') => {
      setGenerationSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    try {
      updateStep('duplicates', 'loading');
      // Fetch existing problems to avoid duplicates
      const existingProblems = await problemService.getAllProblems();
      updateStep('duplicates', 'completed');
      
      updateStep('concept', 'loading');
      // Briefly simulate step transitions for UI feedback
      await new Promise(r => setTimeout(r, 800));
      updateStep('concept', 'completed');
      updateStep('statement', 'loading');

      const generated = await aiService.generateProblem(
        aiUserPrompt, 
        existingProblems,
        formData.category, 
        formData.difficulty
      );
      
      updateStep('statement', 'completed');
      updateStep('testcases', 'loading');
      await new Promise(r => setTimeout(r, 600));
      updateStep('testcases', 'completed');
      updateStep('solution', 'loading');
      await new Promise(r => setTimeout(r, 600));
      updateStep('solution', 'completed');
      updateStep('finalizing', 'loading');
      await new Promise(r => setTimeout(r, 600));

      if (generated) {
        const testCasesWithIds = (generated.testCases || []).map((tc: any) => ({
          ...tc,
          id: tc.id || Math.random().toString(36).substr(2, 9)
        }));

        setFormData(prev => ({
          ...prev,
          ...generated,
          testCases: testCasesWithIds,
          title: generated.title || prev.title,
          slug: (generated.title || prev.title).toLowerCase().replace(/\s+/g, '-')
        }));
        updateStep('finalizing', 'completed');
        
        // Brief pause to let user see ticks before closing
        await new Promise(r => setTimeout(r, 1000));
        setShowAiPrompt(false);
        setAiUserPrompt('');
      }
    } catch (error) {
      console.error('Error generating problem with AI:', error);
      alert('AI generation failed.');
      setGenerationSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error' } : s));
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateMoreTestCases = async () => {
    if (!formData.statement) {
      alert('Please provide a problem statement first.');
      return;
    }

    setMoreTestCasesLoading(true);
    try {
      const moreTestCases = await aiService.generateMoreTestCases(formData.statement, formData.testCases);
      if (moreTestCases && moreTestCases.length > 0) {
        const newTestCases = moreTestCases.map((tc: any) => ({
          ...tc,
          id: Math.random().toString(36).substr(2, 9)
        }));
        setFormData(prev => ({
          ...prev,
          testCases: [...prev.testCases, ...newTestCases]
        }));
      }
    } catch (error) {
      console.error('Error generating more test cases:', error);
      alert('Failed to generate more test cases.');
    } finally {
      setMoreTestCasesLoading(false);
    }
  };

  const addTestCase = () => {
    const newTestCase: TestCase = {
      id: Math.random().toString(36).substr(2, 9),
      input: '',
      expectedOutput: '',
      isPublic: false
    };
    setFormData(prev => ({
      ...prev,
      testCases: [...prev.testCases, newTestCase]
    }));
  };

  const removeTestCase = (id: string) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.filter(tc => tc.id !== id)
    }));
  };

  const updateTestCase = (id: string, field: keyof TestCase, value: any) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc)
    }));
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const updateTemplate = (language: string, template: string) => {
    setFormData(prev => {
      const templates = [...(prev.codeTemplates || [])];
      const index = templates.findIndex(t => t.language === language);
      if (index >= 0) {
        templates[index] = { language, template };
      } else {
        templates.push({ language, template });
      }
      return { ...prev, codeTemplates: templates };
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 p-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{problem ? 'Edit Problem' : 'Create New Problem'}</h2>
            <p className="text-sm text-gray-400">Define the challenge, constraints, and test cases.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAiPrompt(true)}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl transition-all border border-indigo-600/20 disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Auto-Generate
          </button>
          <div className="h-8 w-px bg-white/10 mx-1" />
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {problem ? 'Update Problem' : 'Save Problem'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-6 bg-white/[0.01] sticky top-[97px] z-20 backdrop-blur-md">
        {[
          { id: 'details', label: 'Problem Details', icon: FileText },
          { id: 'testcases', label: 'Test Cases', icon: CheckCircle2 },
          { id: 'editorial', label: 'Editorial', icon: Lightbulb },
          { id: 'solutions', label: 'Reference Solution', icon: Eye },
          { id: 'templates', label: 'Code Templates', icon: Braces },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Prompt Modal */}
      <AnimatePresence>
        {showAiPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-white/10 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">What's the challenge?</h3>
                </div>
                <button onClick={() => setShowAiPrompt(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Describe the theme, topic, or specific DSA concept. AI will generate all fields, ensuring it doesn't duplicate existing problems.
                </p>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Target Difficulty</label>
                  <div className="flex gap-2">
                    {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setFormData({ ...formData, difficulty: level })}
                        className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                          formData.difficulty === level 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                            : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea 
                  value={aiUserPrompt}
                  onChange={(e) => setAiUserPrompt(e.target.value)}
                  placeholder="e.g. A problem about dynamic programming and trees involving path sum..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-indigo-500/50 transition-all resize-none text-sm"
                  autoFocus
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowAiPrompt(false)}
                  disabled={aiLoading}
                  className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="flex-2 py-3 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiLoading ? 'Generating...' : 'Generate Everything'}
                </button>
              </div>

              {aiLoading && (
                <div className="space-y-3 p-6 bg-black/20 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                    Generation Progress
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {generationSteps.map((step) => (
                      <div key={step.id} className="flex items-center justify-between group">
                        <span className={`text-xs transition-colors ${step.status === 'completed' ? 'text-emerald-400' : step.status === 'loading' ? 'text-white' : 'text-gray-600'}`}>
                          {step.label}
                        </span>
                        {step.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        {step.status === 'loading' && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                        {step.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                        {step.status === 'pending' && <X className="w-3.5 h-3.5 text-gray-800" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column: Basic Info */}
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Problem Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. Two Sum"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all text-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Difficulty</label>
                  <select 
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all appearance-none text-white"
                  >
                    <option value="Easy" className="bg-[#1a1a1a]">Easy</option>
                    <option value="Medium" className="bg-[#1a1a1a]">Medium</option>
                    <option value="Hard" className="bg-[#1a1a1a]">Hard</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Category</label>
                  <input 
                    type="text" 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Algorithms"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, idx) => (
                    <span key={`${tag}-${idx}`} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-6 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                  <button 
                    onClick={addTag}
                    className="px-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Problem Statement (Markdown)</label>
                  <button 
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {showPreview ? <FileText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPreview ? 'Show Editor' : 'Show Preview'}
                  </button>
                </div>
                {showPreview ? (
                  <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 px-6 min-h-[300px] prose prose-invert prose-sm max-w-none overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {formData.statement || '*No content to preview*'}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <textarea 
                    value={formData.statement}
                    onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                    rows={12}
                    placeholder="Describe the problem..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all resize-none font-mono text-sm leading-relaxed"
                  />
                )}
              </div>
            </div>

            {/* Right Column: Constraints & Formats */}
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Constraints</label>
                <textarea 
                  value={formData.constraints}
                  onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                  rows={4}
                  placeholder="e.g. 1 <= n <= 10^5"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all resize-none font-mono text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Input Format</label>
                <textarea 
                  value={formData.inputFormat}
                  onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all resize-none font-mono text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Output Format</label>
                <textarea 
                  value={formData.outputFormat}
                  onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all resize-none font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sample Input</label>
                  <textarea 
                    value={formData.sampleInput}
                    onChange={(e) => setFormData({ ...formData, sampleInput: e.target.value })}
                    rows={6}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all resize-none font-mono text-sm text-blue-400"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sample Output</label>
                  <textarea 
                    value={formData.sampleOutput}
                    onChange={(e) => setFormData({ ...formData, sampleOutput: e.target.value })}
                    rows={6}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all resize-none font-mono text-sm text-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testcases' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Test Cases</h3>
                <p className="text-gray-400 mt-1">Add hidden test cases to validate user submissions.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleGenerateMoreTestCases}
                  disabled={moreTestCasesLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-2xl transition-all border border-indigo-600/20 font-bold disabled:opacity-50"
                >
                  {moreTestCasesLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate More (AI)
                </button>
                <button 
                  onClick={addTestCase}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-lg shadow-blue-600/20 font-bold"
                >
                  <Plus className="w-5 h-5" />
                  Add Test Case
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.testCases.map((tc, index) => (
                <div key={tc.id} className="bg-[#141414] border border-white/5 rounded-3xl p-8 space-y-6 hover:border-white/10 transition-all group relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Test Case</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group/label">
                        <div className={`w-10 h-5 rounded-full transition-all relative ${tc.isPublic ? 'bg-blue-600' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${tc.isPublic ? 'left-6' : 'left-1'}`} />
                        </div>
                        <input 
                          type="checkbox" 
                          checked={tc.isPublic}
                          onChange={(e) => updateTestCase(tc.id, 'isPublic', e.target.checked)}
                          className="hidden"
                        />
                        <span className="text-xs font-bold text-gray-500 group-hover/label:text-gray-300">Public</span>
                      </label>
                      <button 
                        onClick={() => removeTestCase(tc.id)}
                        className="p-2 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Input</label>
                      <textarea 
                        value={tc.input}
                        onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                        rows={4}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500/30 transition-all font-mono text-sm text-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expected Output</label>
                      <textarea 
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                        rows={4}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500/30 transition-all font-mono text-sm text-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {formData.testCases.length === 0 && (
                <div className="col-span-full text-center py-32 border-2 border-dashed border-white/5 rounded-[40px] text-gray-500 bg-white/[0.01]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-2">
                      <AlertCircle className="w-8 h-8 opacity-20" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-400">No test cases yet</h4>
                    <p className="max-w-xs mx-auto">Add at least one test case to validate user submissions and ensure problem quality.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'editorial' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-indigo-400">Problem Editorial</h4>
                <p className="text-gray-400 mt-2 leading-relaxed">Provide a detailed explanation of the optimal approach, time/space complexity analysis, and common pitfalls. This helps users learn after they've attempted the problem.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Editorial Content (Markdown)</label>
                <button 
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {showPreview ? <FileText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPreview ? 'Show Editor' : 'Show Preview'}
                </button>
              </div>
              {showPreview ? (
                <div className="w-full bg-white/[0.02] border border-white/10 rounded-3xl py-6 px-8 min-h-[500px] prose prose-invert prose-sm max-w-none overflow-y-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {formData.editorial || '*No content to preview*'}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea 
                  value={formData.editorial}
                  onChange={(e) => setFormData({ ...formData, editorial: e.target.value })}
                  rows={25}
                  placeholder="Explain the optimal approach..."
                  className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 focus:outline-none focus:border-blue-500/50 transition-all resize-none font-mono text-sm leading-relaxed"
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'solutions' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-emerald-400">Reference Solution</h4>
                <p className="text-gray-400 mt-2 leading-relaxed">Add a complete, working solution that passes all test cases. This serves as the gold standard for the problem.</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reference Code</label>
              <textarea 
                value={formData.referenceSolution}
                onChange={(e) => setFormData({ ...formData, referenceSolution: e.target.value })}
                rows={25}
                placeholder="Paste your reference solution here..."
                className="w-full bg-black/40 border border-white/10 rounded-3xl py-6 px-8 focus:outline-none focus:border-blue-500/50 transition-all resize-none font-mono text-sm leading-relaxed text-emerald-400"
              />
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {SUPPORTED_LANGUAGES.map(lang => (
                <div key={lang.id} className="bg-[#141414] border border-white/5 rounded-3xl p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400">
                        <Braces className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-lg">{lang.name} Template</h4>
                    </div>
                  </div>
                  <textarea 
                    value={formData.codeTemplates?.find(t => t.language === lang.id)?.template || ''}
                    onChange={(e) => updateTemplate(lang.id, e.target.value)}
                    rows={10}
                    placeholder={`Enter ${lang.name} boilerplate code...`}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/30 transition-all resize-none font-mono text-xs text-gray-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemForm;
