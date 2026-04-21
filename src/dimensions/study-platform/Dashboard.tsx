import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Globe, Activity, MessageSquare, Settings, Menu, X, MapPin, ChevronLeft, ChevronRight, LogOut, Sparkles,
  LayoutDashboard, Users, Hash, Star, Clock, ShieldCheck, Scale, Compass
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { User, Group, PrivateChat, Message, UserStats } from "./types";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import AnalysisView from "./components/AnalysisView";
import AdminAnalysisView from "./components/AdminAnalysisView";
import PublicGroupsView from "./components/PublicGroupsView";
import PrivateMessagesView from "./components/PrivateMessagesView";
import AIChatView from "./components/AIChatView";
import SettingsView from "./components/SettingsView";
import ExploreView from "./components/ExploreView";
import { useRole } from "../../contexts/RoleContext";
import { useSettings } from "../../contexts/SettingsContext";

export default function StudyDashboard() {
  const { role } = useRole();
  const { userProfile, loading, theme, logout } = useSettings();
  const [activeView, setActiveView] = useState<'analysis' | 'public' | 'private' | 'ai' | 'settings' | 'explore'>('analysis');
  const [adminViewMode, setAdminViewMode] = useState<'system' | 'personal'>('system');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [messageLimits, setMessageLimits] = useState<Record<string, number>>({});
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Real-time User Stats
  useEffect(() => {
    if (!userProfile.id || userProfile.id === 'guest') return;
    const statsRef = doc(db, "users", userProfile.id, "stats", "current");
    const unsubscribe = onSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserStats(snapshot.data() as UserStats);
      }
    });
    return () => unsubscribe();
  }, [userProfile.id]);

  // Real-time Public Groups
  useEffect(() => {
    if (!userProfile.id || userProfile.id === 'guest') return;
    const q = query(collection(db, "groups"), where("privacy", "in", ["public", "private", "hidden"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data
          } as Group;
        })
        .filter(g => 
          g.privacy !== 'hidden' || 
          g.creatorId === userProfile.id || 
          g.membersList?.includes(userProfile.id)
        )
        .map(g => ({
          ...g,
          isJoined: g.membersList?.includes(userProfile.id)
        }));
      setPublicGroups(groups);
    }, (error) => {
      console.error("Groups listener error:", error);
    });
    return () => unsubscribe();
  }, [userProfile.id]);

  // Real-time Private Chats
  useEffect(() => {
    if (!userProfile.id || userProfile.id === 'guest') return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", userProfile.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrivateChat));
      setPrivateChats(chats);
    });
    return () => unsubscribe();
  }, [userProfile.id]);

  // Real-time Messages for active chat
  useEffect(() => {
    if (!activeChatId) return;
    const collectionName = activeView === 'public' ? "groups" : "chats";
    const limitCount = messageLimits[activeChatId] || 30;
    const q = query(
      collection(db, collectionName, activeChatId, "messages"), 
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as Message))
        .filter(msg => {
          // If message is pending, only show to sender or admins
          if (msg.status === 'pending') {
            return msg.senderId === userProfile.id || role === 'admin' || role === 'teacher';
          }
          return true;
        })
        .reverse(); // Reverse because we ordered by desc for limitToLast effect but want to display in asc order
      
      setMessages(prev => ({ ...prev, [activeChatId]: msgs }));
    });
    return () => unsubscribe();
  }, [activeChatId, activeView, userProfile.id, role, messageLimits]);

  const handleLoadMoreMessages = (chatId: string) => {
    setMessageLimits(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || 30) + 30
    }));
  };

  // Update current activity based on active view
  useEffect(() => {
    if (!userProfile.id || userProfile.id === 'guest') return;
    
    let activityName = "Active Learning Session";
    let icon = "LayoutDashboard";
    let color = "text-blue-400";
    let bg = "bg-blue-500/20";

    switch (activeView) {
      case 'analysis': activityName = "Analyzing Performance"; icon = "Activity"; color = "text-purple-400"; bg = "bg-purple-500/20"; break;
      case 'public': activityName = "Browsing Public Groups"; icon = "Globe"; color = "text-green-400"; bg = "bg-green-500/20"; break;
      case 'private': activityName = "Private Messaging"; icon = "MessageSquare"; color = "text-pink-400"; bg = "bg-pink-500/20"; break;
      case 'ai': activityName = "Chatting with AI Assistant"; icon = "Sparkles"; color = "text-yellow-400"; bg = "bg-yellow-500/20"; break;
      case 'settings': activityName = "Configuring Settings"; icon = "Settings"; color = "text-gray-400"; bg = "bg-gray-500/20"; break;
    }

    const statsRef = doc(db, "users", userProfile.id, "stats", "current");
    const userRef = doc(db, "users", userProfile.id);
    
    // Log to system logs for admin view
    if (userProfile.id !== 'guest') {
      addDoc(collection(db, "system_logs"), {
        userId: userProfile.id,
        userName: userProfile.name,
        action: `Switched view to ${activeView}`,
        timestamp: serverTimestamp(),
        type: 'info',
        dimension: 'Study'
      }).catch(err => console.error("Failed to log activity:", err));

      // Update main user doc for real-time status in admin dashboard
      updateDoc(userRef, {
        currentActivity: activityName,
        lastActive: serverTimestamp()
      }).catch(err => console.error("Failed to update user status:", err));
    }

    // We use userStats to prepend, but we don't want to trigger this effect on every userStats change.
    // So we just use the current userStats value when activeView changes.
    const currentLog = userStats?.activityLog || [];
    const newLog = [
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: `Attention shifted to ${activityName}`,
        icon,
        color,
        bg
      },
      ...currentLog
    ].slice(0, 5);

    updateDoc(statsRef, {
      currentActivity: activityName,
      activityLog: newLog
    }).catch(err => console.error("Failed to update activity:", err));
  }, [activeView, userProfile.id]); // Deliberately omitting userStats to avoid infinite loops

  // Periodic heartbeat to keep status "Online"
  useEffect(() => {
    if (!userProfile.id || userProfile.id === 'guest') return;
    const userRef = doc(db, "users", userProfile.id);
    const heartbeat = setInterval(() => {
      updateDoc(userRef, { lastActive: serverTimestamp() }).catch(() => {});
    }, 30000); // Every 30 seconds
    return () => clearInterval(heartbeat);
  }, [userProfile.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted font-mono text-xs uppercase tracking-widest">Initializing Ecosystem...</p>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (text: string, file?: { url: string, name: string, type: string, size: number }, replyTo?: { id: string, text: string, senderName: string, senderId: string }, extraFields?: Partial<Message>) => {
    if (!activeChatId) return;

    const isPublic = activeView === 'public';
    const chat = isPublic ? publicGroups.find(g => g.id === activeChatId) as Group : privateChats.find(c => c.id === activeChatId);
    
    // Check for post approval
    const userRole = (chat as any)?.roles?.[userProfile.id] || 'member';
    const isAiTarget = text.startsWith('@ai');
    const isCommand = text.startsWith('/');
    const needsApproval = isPublic && (chat as Group)?.postApprovalRequired && userRole === 'member' && !isAiTarget && !isCommand;

    const msgData = {
      senderId: userProfile.id,
      senderName: userProfile.name,
      avatar: userProfile.avatar,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timezone: userProfile.timezone,
      location: userProfile.location,
      localTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: serverTimestamp(),
      status: needsApproval ? 'pending' : 'sent',
      ...(file && {
        fileUrl: file.url,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }),
      ...(replyTo && { replyTo: replyTo }),
      ...extraFields
    };

    try {
      const collectionName = isPublic ? "groups" : "chats";
      await addDoc(collection(db, collectionName, activeChatId, "messages"), msgData);
      
      // Log message send
      addDoc(collection(db, "system_logs"), {
        userId: userProfile.id,
        userName: userProfile.name,
        action: `Sent message in ${isPublic ? 'group' : 'chat'} ${activeChatId}`,
        timestamp: serverTimestamp(),
        type: 'success',
        dimension: 'Study'
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const group = publicGroups.find(g => g.id === groupId);
      if (!group) return;

      if (group.bannedUsers?.includes(userProfile.id)) {
        alert("You are banned from this group.");
        return;
      }

      const groupRef = doc(db, "groups", groupId);
      
      if (group.privacy === 'private') {
        await updateDoc(groupRef, {
          pendingRequests: arrayUnion(userProfile.id)
        });
        alert("Join request sent to admin.");
      } else {
        await updateDoc(groupRef, {
          members: (group.members || 0) + 1,
          membersList: arrayUnion(userProfile.id),
          [`roles.${userProfile.id}`]: 'member'
        });
        setActiveChatId(groupId);

        // Log group join
        addDoc(collection(db, "system_logs"), {
          userId: userProfile.id,
          userName: userProfile.name,
          action: `Joined group: ${group.name}`,
          timestamp: serverTimestamp(),
          type: 'success',
          dimension: 'Study'
        });
      }
    } catch (err) {
      console.error("Error joining group:", err);
    }
  };

  const handleCreatePublicGroup = async (name: string, topic: string, privacy: 'public' | 'private' | 'hidden' = 'public') => {
    try {
      const docRef = await addDoc(collection(db, "groups"), {
        name,
        topic,
        members: 1,
        isPublic: privacy === 'public',
        privacy,
        creatorId: userProfile.id,
        membersList: [userProfile.id],
        roles: { [userProfile.id]: 'admin' },
        createdAt: serverTimestamp()
      });
      setActiveChatId(docRef.id);

      // Log group creation
      addDoc(collection(db, "system_logs"), {
        userId: userProfile.id,
        userName: userProfile.name,
        action: `Created public group: ${name}`,
        timestamp: serverTimestamp(),
        type: 'success',
        dimension: 'Study'
      });
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const handleCreatePrivateChat = async (name: string, type: 'dm' | 'group', participants: string[], participantDetails: Record<string, { name: string, avatar: string }>) => {
    try {
      const docRef = await addDoc(collection(db, "chats"), {
        name,
        type,
        participants,
        participantDetails,
        members: participants.length,
        creatorId: userProfile.id,
        roles: { [userProfile.id]: 'admin' },
        createdAt: serverTimestamp()
      });
      setActiveChatId(docRef.id);

      // Log chat creation
      addDoc(collection(db, "system_logs"), {
        userId: userProfile.id,
        userName: userProfile.name,
        action: `Created private ${type}: ${name}`,
        timestamp: serverTimestamp(),
        type: 'success',
        dimension: 'Study'
      });
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  const handleViewChange = (view: 'analysis' | 'public' | 'private' | 'ai' | 'settings' | 'explore') => {
    setActiveView(view);
    setActiveChatId(null);
    setIsSidebarOpen(false);
  };

  const NavItem = ({ id, icon: Icon, label, color = "primary" }: { id: any, icon: any, label: string, color?: string }) => (
    <button 
      onClick={() => handleViewChange(id)}
      className={`w-full flex items-center ${isDesktopSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeView === id ? `bg-${color} text-white shadow-lg shadow-${color}/20` : 'text-muted hover:bg-surface-hover hover:text-text'}`}
      title={isDesktopSidebarCollapsed ? label : undefined}
    >
      <Icon className={`w-5 h-5 shrink-0 ${activeView === id ? 'text-white' : `text-${color}`}`} /> 
      {!isDesktopSidebarCollapsed && label}
    </button>
  );

  return (
    <div className="h-[100dvh] w-full bg-bg text-text flex overflow-hidden font-sans">
      
      {/* --- MOBILE HEADER REMOVED - Each view handles its own header --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 md:hidden backdrop-blur-sm" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 ${isDesktopSidebarCollapsed ? 'md:w-20' : 'md:w-64'} w-72 border-r border-border bg-surface flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)} 
          className="hidden md:flex absolute -right-3 top-6 w-6 h-6 bg-surface border border-border rounded-full items-center justify-center text-muted hover:text-text hover:bg-surface-hover transition-colors z-50"
        >
          {isDesktopSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`p-6 flex items-center ${isDesktopSidebarCollapsed ? 'justify-center px-2' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          {!isDesktopSidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="font-display font-black leading-none text-lg">Global Study</h1>
              <p className="text-[10px] text-muted uppercase tracking-widest mt-1">Dimension 1</p>
            </div>
          )}
        </div>

        {/* User Mini Profile */}
        <div className={`mx-4 mb-6 p-4 rounded-2xl bg-bg/50 border border-border ${isDesktopSidebarCollapsed ? 'flex justify-center px-2' : ''}`}>
          <div className={`flex items-center gap-3 ${isDesktopSidebarCollapsed ? '' : 'mb-3'}`}>
            <img src={userProfile.avatar} alt="You" className="w-9 h-9 rounded-full border border-border shrink-0" />
            {!isDesktopSidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{userProfile.name}</p>
                <p className="text-[10px] text-muted flex items-center gap-1 truncate uppercase tracking-tighter font-mono">{role}</p>
              </div>
            )}
          </div>
          {!isDesktopSidebarCollapsed && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold">
                <span className="text-muted">Focus</span>
                <span className="text-primary">{userStats?.focusLevel || 0}%</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${userStats?.focusLevel || 0}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar pb-6">
          {/* Main Section */}
          <div>
            {!isDesktopSidebarCollapsed && <p className="px-4 text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-3">Main</p>}
            <div className="space-y-1">
              <NavItem id="analysis" icon={LayoutDashboard} label="Dashboard" />
              <NavItem id="ai" icon={Sparkles} label="AI Assistant" color="purple-500" />
            </div>
          </div>

          {/* Social Section */}
          <div>
            {!isDesktopSidebarCollapsed && <p className="px-4 text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-3">Community</p>}
            <div className="space-y-1">
              <NavItem id="explore" icon={Compass} label="Explore" />
              <NavItem id="public" icon={Users} label="Study Groups" />
              <NavItem id="private" icon={MessageSquare} label="Messages" />
              <a 
                href="https://ploy-argu-minds.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-full flex items-center ${isDesktopSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-muted hover:bg-surface-hover hover:text-text`}
                title={isDesktopSidebarCollapsed ? "Poly Argu-Minds" : undefined}
              >
                <Scale className={`w-5 h-5 shrink-0 text-orange-400`} /> 
                {!isDesktopSidebarCollapsed && "Poly Argu-Minds"}
              </a>
            </div>
          </div>

          {/* System Section */}
          <div>
            {!isDesktopSidebarCollapsed && <p className="px-4 text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-3">System</p>}
            <div className="space-y-1">
              <NavItem id="settings" icon={Settings} label="Settings" color="zinc-500" />
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        {!isDesktopSidebarCollapsed && (
          <div className="p-6 border-t border-border">
            <div className="flex items-center gap-2 text-[10px] text-muted font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>SECURE ECOSYSTEM v1.0</span>
            </div>
          </div>
        )}
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative bg-bg flex flex-col min-w-0 md:pt-0 min-h-0">
        {/* Global Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
        
        {activeView === 'analysis' && (
          role === 'admin' 
            ? (adminViewMode === 'system' ? <AdminAnalysisView onSwitchToPersonal={() => setAdminViewMode('personal')} onOpenSidebar={() => setIsSidebarOpen(true)} /> : <AnalysisView onSwitchToSystem={() => setAdminViewMode('system')} onOpenSidebar={() => setIsSidebarOpen(true)} />) 
            : <AnalysisView onOpenSidebar={() => setIsSidebarOpen(true)} />
        )}
        {activeView === 'ai' && (
          <ErrorBoundary fallback={<div className="p-8 text-muted">Failed to load AI Assistant.</div>}>
            <AIChatView onOpenSidebar={() => setIsSidebarOpen(true)} />
          </ErrorBoundary>
        )}
        {activeView === 'settings' && (
          <ErrorBoundary fallback={<div className="p-8 text-muted">Failed to load Settings.</div>}>
            <SettingsView onOpenSidebar={() => setIsSidebarOpen(true)} />
          </ErrorBoundary>
        )}
        {activeView === 'explore' && (
          <ErrorBoundary fallback={<div className="p-8 text-muted">Failed to load Explore.</div>}>
            <ExploreView 
              currentUser={userProfile} 
              onOpenSidebar={() => setIsSidebarOpen(true)}
              onStartChat={(targetUser) => {
                // Check if DM already exists
                const existingChat = privateChats.find(c => 
                  c.type === 'dm' && c.participants?.includes(targetUser.id)
                );

                if (existingChat) {
                  setActiveChatId(existingChat.id);
                  setActiveView('private');
                } else {
                  // Create new DM
                  const createDM = async () => {
                    try {
                      const chatData = {
                        name: targetUser.name,
                        type: 'dm',
                        avatar: targetUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}`,
                        participants: [userProfile.id, targetUser.id],
                        participantDetails: {
                          [userProfile.id]: { name: userProfile.name, avatar: userProfile.avatar },
                          [targetUser.id]: { name: targetUser.name, avatar: targetUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}` }
                        },
                        lastRead: {
                          [userProfile.id]: serverTimestamp(),
                          [targetUser.id]: serverTimestamp()
                        },
                        createdAt: serverTimestamp()
                      };
                      const docRef = await addDoc(collection(db, "chats"), chatData);
                      setActiveChatId(docRef.id);
                      setActiveView('private');
                    } catch (err) {
                      console.error("Error creating DM from explore:", err);
                    }
                  };
                  createDM();
                }
              }}
            />
          </ErrorBoundary>
        )}
        {activeView === 'public' && (
          <PublicGroupsView 
            groups={publicGroups}
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
            onJoinGroup={handleJoinGroup}
            currentUser={userProfile}
            messages={messages}
            onSendMessage={handleSendMessage}
            onSendAIMessage={(text) => activeChatId && handleSendMessage(text)} // Simplified for now
            onCreateGroup={handleCreatePublicGroup}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onLoadMoreMessages={handleLoadMoreMessages}
          />
        )}
        {activeView === 'private' && (
          <PrivateMessagesView 
            chats={privateChats}
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
            currentUser={userProfile}
            messages={messages}
            onSendMessage={handleSendMessage}
            onSendAIMessage={(text) => activeChatId && handleSendMessage(text)} // Simplified for now
            onCreateChat={handleCreatePrivateChat}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onLoadMoreMessages={handleLoadMoreMessages}
          />
        )}
      </main>
    </div>
  );
}
