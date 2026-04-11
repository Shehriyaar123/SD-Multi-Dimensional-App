import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, Activity, ShieldCheck, Zap, Clock, Globe, 
  Search, Filter, ArrowUpRight, MessageSquare, AlertCircle,
  Database, Terminal, Eye, Menu, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "../../../firebase";
import { collection, onSnapshot, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { UserProfile } from "../../../contexts/SettingsContext";

interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: any;
  type: 'info' | 'warning' | 'error' | 'success';
  dimension: string;
}

interface UserActivity {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: any;
  currentActivity?: string;
  focusLevel?: number;
  avatar?: string;
}

export default function AdminAnalysisView({ onSwitchToPersonal, onOpenSidebar }: { onSwitchToPersonal?: () => void, onOpenSidebar?: () => void }) {
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeNow: 0,
    totalSessions: 0,
    systemHealth: 98,
    aiUsage: 0,
    hourlyTraffic: Array(24).fill(0).map(() => ({ study: 0, coding: 0 }))
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Real-time Users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userList: UserActivity[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        userList.push({
          id: doc.id,
          name: data.name || "Unknown",
          email: data.email || "N/A",
          role: data.role || "student",
          lastActive: data.lastActive,
          avatar: data.avatar,
          currentActivity: data.currentActivity,
          focusLevel: data.focusLevel
        });
      });
      setUsers(userList);
      setStats(prev => ({ 
        ...prev, 
        totalUsers: userList.length,
        activeNow: userList.filter(u => {
          const lastActiveTime = u.lastActive?.toMillis ? u.lastActive.toMillis() : (u.lastActive?.seconds ? u.lastActive.seconds * 1000 : 0);
          const isOnline = lastActiveTime && (Date.now() - lastActiveTime < 120000);
          return isOnline;
        }).length 
      }));
      setLoading(false);
    });

    // Real-time System Logs & Stats Aggregation
    const logsQuery = query(collection(db, "system_logs"), orderBy("timestamp", "desc"), limit(100));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logList: SystemLog[] = [];
      let aiCount = 0;
      let errorCount = 0;
      const traffic = Array(24).fill(0).map(() => ({ study: 0, coding: 0 }));
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const log = { id: doc.id, ...data } as SystemLog;
        logList.push(log);
        
        // AI Usage Tracking
        if (data.action?.toLowerCase().includes('ai') || data.action?.toLowerCase().includes('assistant')) {
          aiCount++;
        }

        // Error Tracking for Health
        if (data.type === 'error') {
          errorCount++;
        }

        // Traffic Tracking (last 24 hours)
        if (data.timestamp) {
          const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp.seconds * 1000);
          const hour = date.getHours();
          if (data.dimension === 'Study') traffic[hour].study++;
          if (data.dimension === 'Coding') traffic[hour].coding++;
        }
      });

      // Calculate health: 100% - (errors in last 100 logs * 2)
      const health = Math.max(0, 100 - (errorCount * 2));

      setLogs(logList.slice(0, 20)); // Keep only 20 for display
      setStats(prev => ({ 
        ...prev, 
        aiUsage: aiCount,
        hourlyTraffic: traffic,
        systemHealth: health
      }));
    }, (err) => {
      console.warn("System logs listener error:", err);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLogs();
    };
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
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
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
          <span className="font-bold text-sm">System Admin</span>
        </div>
        <button onClick={onOpenSidebar} className="p-2 text-muted hover:text-text">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto custom-scrollbar w-full">
        
        {/* Header */}
        <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-black text-primary uppercase tracking-widest">
              Admin Control Panel
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live System Monitoring
            </div>
          </div>
          <h2 className="text-3xl font-display font-black tracking-tight text-text">Ecosystem Analytics</h2>
          <p className="text-muted mt-1">Real-time overview of all users, interactions, and system health.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {onSwitchToPersonal && (
            <button 
              onClick={onSwitchToPersonal}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-xs font-bold text-primary hover:bg-primary/20 transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              Personal View
            </button>
          )}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-all w-64"
            />
          </div>
          <button className="p-2 bg-surface border border-border rounded-xl text-muted hover:text-text transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Members", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Active Now", value: stats.activeNow, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "System Health", value: `${stats.systemHealth}%`, icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "AI Tool Usage", value: stats.aiUsage, icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-border rounded-3xl p-6 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-xs font-bold text-muted uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="text-3xl font-display font-black text-text">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* User Management Table */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-[2rem] overflow-hidden flex flex-col h-[500px] shadow-xl shadow-black/20">
          <div className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-zinc-900/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg">Registered Members</h3>
            </div>
            <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              View All Users <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg/50 text-[10px] uppercase tracking-[0.2em] text-muted font-black">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.slice(0, 8).map((user) => (
                  <tr key={user.id} className="hover:bg-bg/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="" className="w-8 h-8 rounded-full border border-border" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{user.name}</p>
                          <p className="text-[10px] text-muted truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tighter ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : user.role === 'teacher' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-muted'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const lastActiveTime = user.lastActive?.toMillis ? user.lastActive.toMillis() : (user.lastActive?.seconds ? user.lastActive.seconds * 1000 : 0);
                          const isOnline = lastActiveTime && (Date.now() - lastActiveTime < 120000);
                          return (
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                          );
                        })()}
                        <div className="flex flex-col">
                          <span className="text-xs text-muted truncate max-w-[120px]">
                            {(() => {
                              const lastActiveTime = user.lastActive?.toMillis ? user.lastActive.toMillis() : (user.lastActive?.seconds ? user.lastActive.seconds * 1000 : 0);
                              const isOnline = lastActiveTime && (Date.now() - lastActiveTime < 120000);
                              return isOnline ? (user.currentActivity || "Online") : "Offline";
                            })()}
                          </span>
                          {user.focusLevel !== undefined && (
                            <span className="text-[9px] font-bold text-primary">Focus: {user.focusLevel}%</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted" />
              </div>
              <p className="text-muted font-medium">No users found matching your search.</p>
            </div>
          )}
        </div>

        {/* Real-time System Logs */}
        <div className="bg-surface border border-border rounded-[2rem] flex flex-col overflow-hidden h-[500px] shadow-xl shadow-black/20">
          <div className="p-6 border-b border-border flex items-center justify-between bg-zinc-900/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-purple-500" />
              </div>
              <h3 className="font-bold text-lg">System Logs</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar font-mono text-[11px]">
            {logs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-bg/50 border border-border/50 hover:border-border transition-all group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-black uppercase tracking-tighter ${
                    log.type === 'error' ? 'text-red-500' : 
                    log.type === 'warning' ? 'text-yellow-500' : 
                    log.type === 'success' ? 'text-emerald-500' : 'text-blue-500'
                  }`}>
                    [{log.type}]
                  </span>
                  <span className="text-muted opacity-50">{new Date(log.timestamp?.seconds * 1000).toLocaleTimeString()}</span>
                </div>
                <p className="text-text/90 leading-relaxed">
                  <span className="text-primary font-bold">{log.userName}</span>: {log.action}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] text-muted uppercase tracking-widest">
                    {log.dimension}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-border bg-zinc-900/20">
            <button className="w-full py-2 rounded-xl bg-surface border border-border text-xs font-bold text-muted hover:text-text transition-all flex items-center justify-center gap-2">
              <Database className="w-3 h-3" />
              Export System Logs
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section: Traffic Analysis */}
      <div className="bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              Traffic Analysis
            </h3>
            <p className="text-xs text-muted mt-1">Hourly engagement across all dimensions.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Study</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Coding</span>
            </div>
          </div>
        </div>
        
        <div className="h-48 flex items-end gap-2 md:gap-4">
          {stats.hourlyTraffic.map((hourData, i) => {
            const maxVal = Math.max(...stats.hourlyTraffic.map(h => Math.max(h.study, h.coding, 1)));
            return (
              <div key={i} className="flex-1 flex flex-col gap-1 group">
                <div className="flex-1 flex flex-col justify-end gap-0.5">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(hourData.study / maxVal) * 100}%` }}
                    transition={{ delay: i * 0.02 }}
                    className="w-full bg-primary/40 rounded-t-sm group-hover:bg-primary transition-colors"
                  />
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(hourData.coding / maxVal) * 100}%` }}
                    transition={{ delay: i * 0.02 + 0.1 }}
                    className="w-full bg-purple-500/40 rounded-t-sm group-hover:bg-purple-500 transition-colors"
                  />
                </div>
                <span className="text-[8px] text-muted text-center opacity-0 group-hover:opacity-100 transition-opacity">{i}h</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  </div>
  );
}

function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
