import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Bookmark, 
  Share2, 
  Maximize2, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Info,
  List,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LibraryResource } from '../types';
import { aiService } from '../../coding-platform/services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResourceReaderProps {
  resource: LibraryResource;
  onBack: () => void;
}

const ResourceReader: React.FC<ResourceReaderProps> = ({ resource, onBack }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'qna'>('content');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<{ summary: string, keyPoints: string[] } | null>(null);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chat, setChat] = useState<{ role: 'user' | 'ai', content: string }[]>([]);

  useEffect(() => {
    if (resource.aiSummary && resource.keyPoints) {
      setSummary({ summary: resource.aiSummary, keyPoints: resource.keyPoints });
    }
  }, [resource]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      // In a real app, we'd fetch the actual content of the PDF/URL
      const mockContent = `This is the full content of ${resource.title} by ${resource.author}. It covers various aspects of ${resource.domain} and provides deep insights into ${resource.tags.join(', ')}.`;
      const result = await aiService.summarizeResource(mockContent);
      setSummary(result);
    } catch (error) {
      console.error("Summarization error:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMsg = question;
    setQuestion('');
    setChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAsking(true);

    try {
      // Mock AI response for now
      setTimeout(() => {
        setChat(prev => [...prev, { role: 'ai', content: `Based on the resource "${resource.title}", the answer to your question about "${userMsg}" is that the author emphasizes the importance of structured data and algorithmic efficiency.` }]);
        setIsAsking(false);
      }, 1000);
    } catch (error) {
      console.error("Q&A error:", error);
      setIsAsking(false);
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
          <div className="flex flex-col">
            <h2 className="font-bold text-sm truncate max-w-[300px] bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {resource.title}
            </h2>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{resource.author}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-white/5 rounded-xl text-gray-400">
            <Bookmark className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-xl text-gray-400">
            <Share2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            download
            className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/5"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Reader */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a] relative">
          <div className="flex-1 overflow-y-auto p-12 flex justify-center custom-scrollbar">
            <div className="max-w-3xl w-full bg-white text-black min-h-[1000px] p-16 shadow-2xl rounded-sm font-serif leading-relaxed">
              <h1 className="text-4xl font-bold mb-8">{resource.title}</h1>
              <p className="text-xl text-gray-600 mb-12 italic">By {resource.author}</p>
              
              <div className="space-y-6 text-lg">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <div className="bg-gray-100 p-8 rounded-lg border-l-4 border-indigo-600 my-12">
                  <h3 className="font-sans font-bold text-indigo-600 uppercase tracking-widest text-sm mb-4">Key Insight</h3>
                  <p className="font-sans italic text-gray-700">
                    "The integration of AI into knowledge management systems is not just an upgrade; it's a paradigm shift in how we interact with information."
                  </p>
                </div>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                </p>
              </div>
            </div>
          </div>

          {/* Reader Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <button className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-sm font-bold px-4">Page 1 of 42</span>
            <button className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <button className="p-2 hover:bg-white/10 rounded-xl transition-all"><Maximize2 className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Right Panel: AI Assistant */}
        <div className="w-[400px] flex flex-col border-l border-white/5 bg-[#080808]">
          <div className="flex border-b border-white/5 px-4 bg-black/20">
            {[
              { id: 'content', label: 'Details', icon: Info },
              { id: 'summary', label: 'AI Summary', icon: Sparkles },
              { id: 'qna', label: 'Ask AI', icon: MessageSquare },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-4 text-xs font-bold transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'content' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{resource.description}</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Type</p>
                      <p className="text-sm font-bold mt-1">{resource.type}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Source</p>
                      <p className="text-sm font-bold mt-1">{resource.source}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags?.map(tag => (
                      <span key={tag} className="text-[10px] px-2.5 py-1 bg-white/5 text-gray-400 rounded-lg uppercase tracking-widest font-bold border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="space-y-8">
                {!summary && !isSummarizing && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 text-indigo-400">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold mb-2">Generate AI Summary</h4>
                    <p className="text-sm text-gray-500 mb-8">Let AI analyze this resource and provide a concise summary with key learning points.</p>
                    <button 
                      onClick={handleSummarize}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                      Summarize Now
                    </button>
                  </div>
                )}

                {isSummarizing && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-sm text-gray-500 animate-pulse">AI is reading and analyzing...</p>
                  </div>
                )}

                {summary && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <List className="w-3.5 h-3.5" /> Executive Summary
                      </h3>
                      <div className="text-sm text-gray-300 leading-relaxed bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5">
                        {summary.summary}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Key Learning Points
                      </h3>
                      <div className="space-y-3">
                        {summary.keyPoints?.map((point, i) => (
                          <div key={i} className="flex gap-3 text-sm text-gray-300 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold shrink-0">
                              {i + 1}
                            </div>
                            {point}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'qna' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 space-y-4 mb-6">
                  {chat.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-12 h-12 opacity-10 mx-auto mb-4" />
                      <p className="text-sm italic">Ask anything about this resource...</p>
                    </div>
                  )}
                  {chat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isAsking && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAsk} className="relative">
                  <input 
                    type="text" 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={isAsking || !question.trim()}
                    className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceReader;
