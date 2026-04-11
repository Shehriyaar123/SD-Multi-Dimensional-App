import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Globe, Brain, Zap, MessageSquare, Trash2, ChevronLeft, ChevronRight, Plus, History, Menu, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { askGemini, chatWithGemini } from '../../../services/aiService';
import { useSettings } from '../../../contexts/SettingsContext';
import { db } from '../../../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface AIChat {
  id: string;
  title: string;
  createdAt: any;
  lastMessage?: string;
  collectionName: 'sessions' | 'ai_chats';
}

interface AIMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: any;
}

export default function AIChatView({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { user } = useSettings();
  const [chats, setChats] = useState<AIChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // AI Options
  const [mode, setMode] = useState<'flash' | 'pro' | 'flash-lite' | 'python'>('flash');
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load Chats
  useEffect(() => {
    if (!user) return;
    
    // Fetch from sessions
    const sessionsQuery = query(collection(db, "users", user.uid, "sessions"));
    const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const chatList: AIChat[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.title) { // Only include AI chats, not login sessions
          chatList.push({ id: doc.id, ...data, collectionName: 'sessions' } as AIChat);
        }
      });
      
      // Also fetch from ai_chats just in case there are old ones
      const aiChatsQuery = query(collection(db, "users", user.uid, "ai_chats"));
      const unsubscribeAiChats = onSnapshot(aiChatsQuery, (aiSnapshot) => {
        const allChats = [...chatList];
        aiSnapshot.forEach(doc => {
          const data = doc.data();
          if (!allChats.find(c => c.id === doc.id)) {
            allChats.push({ id: doc.id, ...data, collectionName: 'ai_chats' } as AIChat);
          }
        });
        
        // Sort locally
        allChats.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        setChats(allChats);
      }, (error) => {
        console.error("Error fetching ai_chats:", error);
      });
      
      return () => unsubscribeAiChats();
    }, (error) => {
      console.error("Error fetching sessions:", error);
    });
    
    return () => unsubscribeSessions();
  }, [user]);

  // Load Messages
  useEffect(() => {
    if (!user || !activeChatId) {
      setMessages([]);
      return;
    }
    
    const activeChat = chats.find(c => c.id === activeChatId);
    const collectionName = activeChat?.collectionName || 'sessions';
    
    const msgsQuery = query(
      collection(db, "users", user.uid, collectionName, activeChatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
      const msgList: AIMessage[] = [];
      snapshot.forEach(doc => msgList.push({ id: doc.id, ...doc.data() } as AIMessage));
      setMessages(msgList);
    });
    return () => unsubscribe();
  }, [user, activeChatId, chats]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createNewChat = async (firstMessage?: string) => {
    if (!user) return null;
    const chatRef = await addDoc(collection(db, "users", user.uid, "sessions"), {
      title: firstMessage ? (firstMessage.slice(0, 30) + '...') : "New Chat",
      createdAt: serverTimestamp(),
    });
    setActiveChatId(chatRef.id);
    return chatRef.id;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    let chatId = activeChatId;
    let collectionName = 'sessions';
    
    if (!chatId) {
      chatId = await createNewChat(input);
    } else {
      const activeChat = chats.find(c => c.id === chatId);
      if (activeChat) collectionName = activeChat.collectionName;
    }
    
    if (!chatId) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    try {
      // Save user message
      await addDoc(collection(db, "users", user.uid, collectionName, chatId, "messages"), {
        role: 'user',
        text: userText,
        timestamp: serverTimestamp()
      });

      // Log AI tool usage for admin
      addDoc(collection(db, "system_logs"), {
        userId: user.uid,
        userName: user.displayName || "User",
        action: `Used AI Assistant (${mode} mode)`,
        timestamp: serverTimestamp(),
        type: 'info',
        dimension: 'Study'
      });

      // Prepare history for Gemini
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      history.push({ role: 'user', parts: [{ text: userText }] });

      let aiResponse = "";
      if (mode === 'python') {
        aiResponse = "Python Expert mode is currently being integrated with the backend. Using Gemini Flash for now.\n\n" + await askGemini(userText, 'flash', useSearch, useMaps);
      } else {
        aiResponse = await chatWithGemini(history, mode as any, useSearch, useMaps);
      }

      // Save AI response
      await addDoc(collection(db, "users", user.uid, collectionName, chatId, "messages"), {
        role: 'model',
        text: aiResponse,
        timestamp: serverTimestamp()
      });

    } catch (err) {
      console.error(err);
      await addDoc(collection(db, "users", user.uid, collectionName, chatId, "messages"), {
        role: 'model',
        text: 'Sorry, I encountered an error.',
        timestamp: serverTimestamp()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (id: string) => {
    if (!user) return;
    const activeChat = chats.find(c => c.id === id);
    const collectionName = activeChat?.collectionName || 'sessions';
    await deleteDoc(doc(db, "users", user.uid, collectionName, id));
    if (activeChatId === id) setActiveChatId(null);
  };

  return (
    <div className="flex-1 flex h-full bg-bg overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-border bg-surface/20 flex flex-col shrink-0"
          >
            <div className="p-4">
              <button 
                onClick={() => setActiveChatId(null)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-surface/50 hover:bg-surface rounded-xl text-sm font-medium transition-all border border-border/50 text-text"
              >
                <Plus className="w-4 h-4" /> New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
              <p className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest">Recent Chats</p>
              {chats.map(chat => (
                <div 
                  key={chat.id}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm cursor-pointer transition-all ${activeChatId === chat.id ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface/50 hover:text-text'}`}
                  onClick={() => setActiveChatId(chat.id)}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{chat.title}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-4 top-6 z-20 p-2 bg-surface border border-border rounded-lg text-muted hover:text-text transition-all"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Header */}
        <header className="h-20 border-b border-border px-6 flex items-center justify-between bg-surface/30 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Link to="/select-dimension" className="md:hidden p-2 -ml-2 text-muted hover:text-text shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <button onClick={onOpenSidebar} className="md:hidden p-2 text-muted hover:text-text shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm md:text-lg text-text truncate">Gemini Assistant</h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-widest font-bold ${mode === 'pro' ? 'text-purple-400' : 'text-primary'}`}>{mode}</span>
                <div className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[10px] text-muted uppercase tracking-widest truncate">Dimension 1</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value as any)}
              className="bg-surface border border-border text-xs text-text rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="flash-lite">Flash Lite (Fast)</option>
              <option value="flash">Flash (Smart)</option>
              <option value="pro">Pro (Deep Think)</option>
              <option value="python">Python Expert</option>
            </select>
            <button 
              onClick={() => setUseSearch(!useSearch)}
              className={`p-2 rounded-lg transition-all ${useSearch ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface text-muted hover:bg-border'}`}
              title="Google Search"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar">
          {!activeChatId && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 animate-pulse">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-4xl font-display font-black tracking-tight mb-4 text-text">How can I help you today?</h2>
              <p className="text-muted text-lg mb-12">I can help you with system design, coding, or any academic research.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  { title: "Summarize my notes", icon: Brain, prompt: "Can you summarize my recent study notes on distributed systems?" },
                  { title: "Debug Python code", icon: Zap, prompt: "I have a bug in my FastAPI route, can you help me debug it?" },
                  { title: "Research topic", icon: Globe, prompt: "What are the latest trends in quantum computing research?" },
                  { title: "Plan study session", icon: History, prompt: "Help me create a 2-hour study plan for my upcoming finals." }
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => { setInput(item.prompt); }}
                    className="p-4 bg-surface/50 border border-border rounded-2xl text-left hover:bg-surface transition-all group"
                  >
                    <item.icon className="w-5 h-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-sm text-text">{item.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                  {msg.role === 'user' ? <UserIcon /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div className={`p-5 rounded-3xl ${msg.role === 'user' ? 'bg-surface text-text rounded-tr-sm border border-border/50 shadow-sm' : 'bg-surface/50 text-text rounded-tl-sm border border-border'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-4 max-w-[85%]">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="p-5 rounded-3xl bg-surface/50 text-muted rounded-tl-sm border border-border">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-12 pt-0">
          <div className="max-w-4xl mx-auto relative group">
            <form onSubmit={handleSend} className="relative">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
                placeholder="Enter a prompt here..."
                className="w-full bg-surface/80 border border-border rounded-[32px] pl-6 pr-16 py-4 text-base text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted/50 resize-none min-h-[64px] max-h-40 custom-scrollbar"
                rows={1}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 p-3 bg-primary text-white rounded-2xl hover:opacity-90 transition-all disabled:opacity-30 disabled:grayscale"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-center text-[10px] text-muted mt-3">Gemini may display inaccurate info, including about people, so double-check its responses.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
}
