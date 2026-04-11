import React, { useState, useEffect } from "react";
import { Search, UserPlus, Check, X, Clock, Compass, MessageSquare, Menu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, ConnectionRequest, OperationType } from "../types";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { useRole } from "../../../contexts/RoleContext";

interface ExploreViewProps {
  currentUser: User;
  onStartChat: (targetUser: User) => void;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function ExploreView({ currentUser, onStartChat, onOpenSidebar }: ExploreViewProps & { onOpenSidebar?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'requests'>('explore');
  const { role } = useRole();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser.id || currentUser.id === 'guest') return;

    // Fetch all users
    const usersPath = "users";
    const usersQuery = query(collection(db, usersPath));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== currentUser.id);
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, usersPath);
      }
    });

    // Fetch connection requests involving current user or all if teacher/admin
    const requestsPath = "connection_requests";
    let requestsQuery;
    if (role === 'teacher' || role === 'admin') {
      requestsQuery = query(collection(db, requestsPath));
    } else {
      requestsQuery = query(
        collection(db, requestsPath), 
        where("participants", "array-contains", currentUser.id)
      );
    }

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConnectionRequest));
      setRequests(requestsList);
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, requestsPath);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRequests();
    };
  }, [currentUser.id, role]);

  const handleConnect = async (targetUser: any) => {
    const requestsPath = "connection_requests";
    const logsPath = "system_logs";
    try {
      await addDoc(collection(db, requestsPath), {
        fromId: currentUser.id,
        fromName: currentUser.name,
        fromAvatar: currentUser.avatar,
        toId: targetUser.id,
        toName: targetUser.name,
        toAvatar: targetUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}`,
        participants: [currentUser.id, targetUser.id],
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Log connection request
      await addDoc(collection(db, logsPath), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: `Requested connection with ${targetUser.name}`,
        timestamp: serverTimestamp(),
        type: 'info',
        dimension: 'Study'
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("permission")) {
        handleFirestoreError(err, OperationType.CREATE, requestsPath);
      }
      console.error("Error sending connection request:", err);
    }
  };

  const handleApprove = async (request: ConnectionRequest) => {
    const requestsPath = `connection_requests/${request.id}`;
    const logsPath = "system_logs";
    try {
      const requestRef = doc(db, "connection_requests", request.id);
      await updateDoc(requestRef, { status: 'approved' });
      
      // Log approval
      await addDoc(collection(db, logsPath), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: `Approved connection: ${request.fromName} -> ${request.toName}`,
        timestamp: serverTimestamp(),
        type: 'success',
        dimension: 'Study'
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("permission")) {
        handleFirestoreError(err, OperationType.UPDATE, requestsPath);
      }
      console.error("Error approving request:", err);
    }
  };

  const handleReject = async (request: ConnectionRequest) => {
    const requestsPath = `connection_requests/${request.id}`;
    try {
      const requestRef = doc(db, "connection_requests", request.id);
      await updateDoc(requestRef, { status: 'rejected' });
    } catch (err) {
      if (err instanceof Error && err.message.includes("permission")) {
        handleFirestoreError(err, OperationType.UPDATE, requestsPath);
      }
      console.error("Error rejecting request:", err);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRequestStatus = (userId: string) => {
    return requests.find(r => r.participants?.includes(userId));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border bg-surface/30 shrink-0">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <Link to="/select-dimension" className="md:hidden p-2 -ml-2 text-muted hover:text-text shrink-0">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <button onClick={onOpenSidebar} className="md:hidden p-2 text-muted hover:text-text shrink-0">
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-text truncate">Explore Community</h2>
              <p className="text-[10px] md:text-xs text-muted truncate">Find and connect with fellow learners</p>
            </div>
          </div>
          
          {(role === 'teacher' || role === 'admin') && (
            <div className="flex bg-bg/50 p-1 rounded-xl border border-border">
              <button 
                onClick={() => setActiveTab('explore')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'explore' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-text'}`}
              >
                Explore
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all relative ${activeTab === 'requests' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-text'}`}
              >
                Requests
                {requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-surface">
                    {requests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="Search by name, email or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'explore' ? (
            <motion.div 
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredUsers.map((user) => {
                const request = getRequestStatus(user.id);
                return (
                  <motion.div 
                    key={user.id}
                    layout
                    className="bg-surface/40 border border-border rounded-2xl p-4 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <img 
                          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-xl object-cover bg-surface border border-border"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-surface rounded-full" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-text truncate">{user.name}</h4>
                        <p className="text-[10px] text-muted uppercase tracking-wider font-mono">{user.role || 'Student'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {!request ? (
                        <button 
                          onClick={() => handleConnect(user)}
                          className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Connect
                        </button>
                      ) : request.status === 'pending' ? (
                        <div className="w-full py-2 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-bold flex items-center justify-center gap-2 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Approval
                        </div>
                      ) : request.status === 'approved' ? (
                        <button 
                          onClick={() => onStartChat(user)}
                          className="w-full py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Message
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleConnect(user)}
                          className="w-full py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-500/20"
                        >
                          <X className="w-3.5 h-3.5" />
                          Rejected - Try Again
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {filteredUsers.length === 0 && !loading && (
                <div className="col-span-full py-20 text-center">
                  <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted/30" />
                  </div>
                  <h3 className="text-lg font-bold text-text">No users found</h3>
                  <p className="text-sm text-muted">Try a different search term</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 max-w-3xl mx-auto"
            >
              {requests.filter(r => r.status === 'pending').map((request) => (
                <div key={request.id} className="bg-surface/40 border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      <img src={request.fromAvatar} alt={request.fromName} className="w-10 h-10 rounded-xl border-2 border-surface bg-surface" />
                      <div className="w-10 h-10 rounded-xl bg-primary/20 border-2 border-surface flex items-center justify-center text-primary">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <img src={request.toAvatar} alt={request.toName} className="w-10 h-10 rounded-xl border-2 border-surface bg-surface" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">
                        <span className="text-primary">{request.fromName}</span> wants to connect with <span className="text-primary">{request.toName}</span>
                      </p>
                      <p className="text-[10px] text-muted">Requested on {new Date(request.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleReject(request)}
                      className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleApprove(request)}
                      className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {requests.filter(r => r.status === 'pending').length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-500/30" />
                  </div>
                  <h3 className="text-lg font-bold text-text">All caught up!</h3>
                  <p className="text-sm text-muted">No pending connection requests</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
