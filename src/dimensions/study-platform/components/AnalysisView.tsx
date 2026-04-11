import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BrainCircuit, Clock, Globe, MapPin, CheckCircle2, Zap, Users, RefreshCw, History, ShieldCheck, Menu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useRole } from "../../../contexts/RoleContext";
import { db } from "../../../firebase";
import { doc, onSnapshot, setDoc, serverTimestamp, collection, query, orderBy, limit, updateDoc } from "firebase/firestore";
import { UserStats } from "../types";

interface PastSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: string;
  durationSeconds: number;
  focusLevel: number;
  cognitiveLoad: string;
}

export default function AnalysisView({ onSwitchToSystem, onOpenSidebar }: { onSwitchToSystem?: () => void, onOpenSidebar?: () => void }) {
  const { user, userProfile } = useSettings();
  const { role } = useRole();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [localDuration, setLocalDuration] = useState("00:00:00");

  useEffect(() => {
    if (!user) return;
    const statsRef = doc(db, "users", user.uid, "stats", "current");
    const unsubscribeStats = onSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserStats;
        if (!data.sessionStartTime) {
          // Add start time if missing
          setDoc(statsRef, { sessionStartTime: Date.now() }, { merge: true });
        }
        setStats(data);
      } else {
        // Initialize with default data if not exists
        const defaultStats: UserStats = {
          focusLevel: 85,
          cognitiveLoad: "Optimal",
          sessionDuration: "00:00:00",
          sessionStartTime: Date.now(),
          activityLog: [
            { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), title: "Session Initialized", icon: "Zap", color: "text-purple-400", bg: "bg-purple-500/20" }
          ]
        };
        setDoc(statsRef, defaultStats);
      }
    }, (error) => {
      console.error("Analysis stats listener error:", error);
    });

    // Fetch past sessions
    const sessionsQuery = query(
      collection(db, "users", user.uid, "study_sessions"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const sessions: PastSession[] = [];
      snapshot.forEach(doc => {
        sessions.push({ id: doc.id, ...doc.data() } as PastSession);
      });
      setPastSessions(sessions);
    });

    return () => {
      unsubscribeStats();
      unsubscribeSessions();
    };
  }, [user]);

  // Local timer for session duration
  useEffect(() => {
    if (!stats?.sessionStartTime) return;
    
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - stats.sessionStartTime!) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setLocalDuration(`${h}:${m}:${s}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [stats?.sessionStartTime]);

  // Auto-simulate activity every 15 seconds to make it feel "real-time"
  useEffect(() => {
    if (!user || !stats) return;
    
    const autoSimulate = setInterval(() => {
      const statsRef = doc(db, "users", user.uid, "stats", "current");
      const userRef = doc(db, "users", user.uid);
      
      const newFocus = Math.max(40, Math.min(100, stats.focusLevel + (Math.floor(Math.random() * 11) - 5))); // +/- 5
      
      let newLoad = "Optimal";
      if (newFocus < 60) newLoad = "Low";
      if (newFocus > 90) newLoad = "High";

      setDoc(statsRef, {
        focusLevel: newFocus,
        cognitiveLoad: newLoad,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Sync to main user doc for admin view
      updateDoc(userRef, {
        focusLevel: newFocus
      }).catch(err => console.error("Failed to sync focus level:", err));
      
    }, 15000);
    
    return () => clearInterval(autoSimulate);
  }, [user, stats]);

  const simulateActivity = async () => {
    if (!user || isSimulating || !stats) return;
    setIsSimulating(true);
    const statsRef = doc(db, "users", user.uid, "stats", "current");
    
    // Simulate some changes
    const newFocus = Math.floor(Math.random() * 20) + 80; // 80-100
    const newLog = [
      { 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        title: "Manual Override: Cognitive Spike", 
        icon: "Zap", 
        color: "text-yellow-400", 
        bg: "bg-yellow-500/20" 
      },
      ...(stats.activityLog || []).slice(0, 4)
    ];

    await setDoc(statsRef, {
      focusLevel: newFocus,
      cognitiveLoad: "High",
      activityLog: newLog,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    setTimeout(() => setIsSimulating(false), 1000);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap": return Zap;
      case "CheckCircle2": return CheckCircle2;
      case "Users": return Users;
      default: return BrainCircuit;
    }
  };

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden h-16 border-b border-border bg-surface/30 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/select-dimension" className="p-2 -ml-2 text-muted hover:text-text shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-sm">Analysis</span>
        </div>
        <button onClick={onOpenSidebar} className="p-2 text-muted hover:text-text">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar w-full">
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight text-text">Real-Time Analysis</h2>
            <p className="text-sm md:text-base text-muted mt-1">Cognitive performance metrics for {userProfile.name}.</p>
          </div>
          <div className="flex items-center gap-3">
            {onSwitchToSystem && (
              <button 
                onClick={onSwitchToSystem}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                System Analytics
              </button>
            )}
            <button 
              onClick={simulateActivity}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-xs font-medium text-text hover:bg-border transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
              Simulate Activity
            </button>
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs md:text-sm font-medium text-primary">Tracking Active</span>
            </div>
          </div>
        </div>

        {/* Mobile-only quick stats row */}
        <div className="md:hidden flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-2xl mb-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary">Tracking Active</span>
          </div>
          <button onClick={simulateActivity} className="text-xs text-muted hover:text-text flex items-center gap-1">
             <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
             Sync
          </button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Current Focus Card */}
        <div className="bg-surface border border-border rounded-3xl p-5 md:p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs md:text-sm text-muted font-medium">Current Activity</h3>
              <p className="text-base md:text-lg font-bold text-text truncate">{stats.currentActivity || "Active Learning Session"}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs md:text-sm mb-1">
                <span className="text-muted">Focus Level</span>
                <span className="text-primary font-bold">{stats.focusLevel}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${stats.focusLevel}%` }} 
                  className="h-full bg-primary rounded-full" 
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs md:text-sm mb-1">
                <span className="text-muted">Cognitive Load</span>
                <span className="text-orange-400 font-bold">{stats.cognitiveLoad}</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} className="h-full bg-orange-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Session Time Card */}
        <div className="bg-surface border border-border rounded-3xl p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm text-muted font-medium">Session Duration</h3>
              <p className="text-base md:text-lg font-bold text-text">{localDuration}</p>
            </div>
          </div>
          <div className="flex items-end gap-1 md:gap-2 h-16 md:h-20">
            {/* Mock Chart based on focus level history would be better, but keeping it simple for now */}
            {[40, 65, 45, 80, 95, 85, stats.focusLevel].map((h, i) => (
              <div key={i} className="flex-1 bg-purple-500/20 rounded-t-sm relative group">
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: `${h}%` }} 
                  transition={{ delay: i * 0.1 }}
                  className="absolute bottom-0 left-0 right-0 bg-purple-500 rounded-t-sm" 
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] md:text-xs text-muted mt-4 text-center">Productivity over last 2 hours</p>
        </div>

        {/* Global Impact Card */}
        <div className="bg-surface border border-border rounded-3xl p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm text-muted font-medium">Global Interactions</h3>
              <p className="text-base md:text-lg font-bold text-text">Active in {userProfile.location}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="flex items-center gap-2 text-text/80"><MapPin className="w-3 h-3 md:w-4 md:h-4 text-muted" /> {userProfile.location}</span>
              <span className="text-muted">Current Node</span>
            </div>
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="flex items-center gap-2 text-text/80"><Globe className="w-3 h-3 md:w-4 md:h-4 text-muted" /> Global Network</span>
              <span className="text-muted">Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Activity Log & Past Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-surface border border-border rounded-3xl p-5 md:p-6">
          <h3 className="font-bold text-base md:text-lg mb-6 text-text">Recent Activity Stream</h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {stats.activityLog.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-surface text-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] bg-surface/50 p-3 md:p-4 rounded-2xl border border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-1">
                      <h4 className="font-bold text-xs md:text-sm text-text">{item.title}</h4>
                      <time className="text-[10px] md:text-xs font-mono text-muted">{item.time}</time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-base md:text-lg text-text">Past Sessions</h3>
            <History className="w-5 h-5 text-muted" />
          </div>
          {pastSessions.length === 0 ? (
            <div className="text-center text-muted text-sm py-8">No past sessions recorded yet.</div>
          ) : (
            <div className="space-y-4">
              {pastSessions.map((session) => (
                <div key={session.id} className="p-4 rounded-2xl border border-border bg-bg/50 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-text">{new Date(session.startTime).toLocaleDateString()}</span>
                    <span className="text-xs font-mono text-muted">{session.duration}</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="text-[10px] text-muted uppercase tracking-wider mb-1">Avg Focus</div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${session.focusLevel}%` }} />
                        </div>
                        <span className="text-xs font-bold text-primary">{session.focusLevel}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-muted uppercase tracking-wider mb-1">Cognitive Load</div>
                      <span className={`text-xs font-bold ${session.cognitiveLoad === 'High' ? 'text-orange-400' : session.cognitiveLoad === 'Low' ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {session.cognitiveLoad}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
