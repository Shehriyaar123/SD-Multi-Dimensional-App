import React, { useState, useEffect } from "react";
import { Search, Plus, Clock, Users, X, Check, MessageSquare, Menu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PrivateChat, User, Message } from "../types";
import ChatInterface from "./ChatInterface";
import { useRole } from "../../../contexts/RoleContext";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

interface PrivateMessagesViewProps {
  chats: PrivateChat[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  currentUser: User;
  messages: Record<string, Message[]>;
  onSendMessage: (text: string, file?: { url: string, name: string, type: string, size: number }, replyTo?: { id: string, text: string, senderName: string, senderId: string }, extraFields?: Partial<Message>) => void;
  onSendAIMessage?: (text: string) => void;
  onCreateChat?: (name: string, type: 'dm' | 'group', participants: string[], participantDetails: Record<string, { name: string, avatar: string }>) => void;
}

export default function PrivateMessagesView({
  chats,
  activeChatId,
  setActiveChatId,
  currentUser,
  messages,
  onSendMessage,
  onSendAIMessage,
  onCreateChat,
  onOpenSidebar
}: PrivateMessagesViewProps & { onOpenSidebar?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [chatType, setChatType] = useState<'dm' | 'group'>('dm');
  const [studentPermissionGranted, setStudentPermissionGranted] = useState(false);
  const { role } = useRole();
  
  // User Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchUsers();
    } else {
      setNewChatName('');
      setUserSearchQuery('');
      setSelectedUsers([]);
      setChatType('dm');
    }
  }, [isCreateModalOpen]);

  const fetchUsers = async () => {
    setIsSearchingUsers(true);
    try {
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      const users: any[] = [];
      snapshot.forEach(doc => {
        if (doc.id !== currentUser.id) {
          users.push({ id: doc.id, ...doc.data() });
        }
      });
      setAvailableUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };
  
  // RBAC Filtering Logic
  const allowedChats = chats.filter(chat => {
    if (chat.type === 'group') return true; // Everyone can access private groups they are in
    
    if (role === 'student') {
      // Students can only DM teachers, UNLESS they have permission
      if (studentPermissionGranted) return true;
      return chat.role === 'teacher';
    }
    if (role === 'teacher') {
      // Teachers can DM students and other teachers
      return chat.role === 'student' || chat.role === 'teacher';
    }
    // 'personal' and 'admin' have full access
    return true;
  });

  const uniqueChats = [];
  const seenNames = new Set();
  for (const chat of allowedChats) {
    if (chat.type === 'dm') {
      if (!seenNames.has(chat.name)) {
        uniqueChats.push(chat);
        seenNames.add(chat.name);
      }
    } else {
      uniqueChats.push(chat);
    }
  }

  const filteredChats = uniqueChats.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const activeChat = uniqueChats.find(c => c.id === activeChatId);

  const filteredAvailableUsers = availableUsers.filter(u => 
    (u.name?.toLowerCase() || '').includes(userSearchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(userSearchQuery.toLowerCase())
  );

  const toggleUserSelection = (user: any) => {
    if (chatType === 'dm') {
      setSelectedUsers([user]);
    } else {
      if (selectedUsers.find(u => u.id === user.id)) {
        setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;
    
    let finalName = newChatName.trim();
    if (chatType === 'dm') {
      finalName = selectedUsers[0].name || 'Direct Message';
    }

    if (finalName && onCreateChat) {
      const participantIds = [currentUser.id, ...selectedUsers.map(u => u.id)];
      const participantDetails: Record<string, { name: string, avatar: string }> = {
        [currentUser.id]: { name: currentUser.name, avatar: currentUser.avatar }
      };
      selectedUsers.forEach(u => {
        participantDetails[u.id] = { name: u.name, avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}` };
      });

      onCreateChat(finalName, chatType, participantIds, participantDetails);
      setIsCreateModalOpen(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-0 w-full bg-bg overflow-hidden">
      {/* Left List */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-border flex-col bg-surface/30 shrink-0 z-20`}
      >
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link to="/select-dimension" className="md:hidden p-2 -ml-2 text-muted hover:text-text shrink-0">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <button onClick={onOpenSidebar} className="md:hidden p-2 text-muted hover:text-text shrink-0">
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="font-bold text-lg text-text">Messages</h2>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors" 
              title="New Message / Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {role === 'student' && (
            <div className="mb-4 flex items-center justify-between bg-primary/10 p-2 rounded-lg border border-primary/20">
              <span className="text-xs text-primary/80">Teacher Permission</span>
              <button 
                onClick={() => setStudentPermissionGranted(!studentPermissionGranted)}
                className={`text-[10px] px-2 py-1 rounded-md font-bold transition-colors ${studentPermissionGranted ? 'bg-emerald-500 text-white' : 'bg-surface text-muted'}`}
              >
                {studentPermissionGranted ? 'Granted' : 'Denied'}
              </button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-primary transition-all placeholder:text-muted/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 custom-scrollbar">
          {filteredChats.map(chat => {
            let displayName = chat.name;
            let displayAvatar = chat.avatar;
            
            if (chat.type === 'dm' && chat.participants && chat.participantDetails) {
              const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
              if (otherParticipantId && chat.participantDetails[otherParticipantId]) {
                displayName = chat.participantDetails[otherParticipantId].name;
                displayAvatar = chat.participantDetails[otherParticipantId].avatar;
              }
            }

            return (
              <div 
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${activeChatId === chat.id ? 'bg-primary/10 border-primary/50' : 'bg-surface/20 border-border hover:border-muted/30'}`}
              >
                <div className="relative shrink-0">
                  <img src={displayAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`} alt={displayName} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover bg-surface" referrerPolicy="no-referrer" />
                  {chat.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-surface rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm text-text truncate">{displayName}</h4>
                  </div>
                  {chat.type === 'dm' ? (
                    <p className="text-[10px] md:text-xs text-muted truncate flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" /> <span className="truncate">{chat.localTime || 'Local Time'} {chat.timezone || ''}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] md:text-xs text-muted truncate flex items-center gap-1">
                      <Users className="w-3 h-3 shrink-0" /> {chat.members || chat.participants?.length || 0} members
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {filteredChats.length === 0 && (
            <div className="text-center text-muted text-sm mt-8">
              No messages found.
              {role === 'student' && <p className="text-xs mt-2">Students can only message teachers directly.</p>}
            </div>
          )}
        </div>
      </motion.div>
      {/* Right Chat */}
      <div className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 min-w-0 bg-bg relative z-10`}>
        {activeChat ? (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-200">
            <ChatInterface 
              chat={activeChat} 
              isPublic={false} 
              currentUser={currentUser} 
              messages={messages[activeChat.id] || []} 
              onSendMessage={onSendMessage}
              onSendAIMessage={onSendAIMessage}
              onBack={() => setActiveChatId(null)}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-[2.5rem] bg-surface border border-border flex items-center justify-center mb-6 shadow-2xl shadow-primary/10">
              <MessageSquare className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Select a conversation</h3>
            <p className="text-sm text-muted max-w-xs">Choose a contact or group from the list to start messaging.</p>
          </div>
        )}
      </div>

      {/* Create Chat Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg text-text">New Message</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted hover:text-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setChatType('dm')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${chatType === 'dm' ? 'bg-primary text-white' : 'bg-surface-hover text-muted hover:text-text'}`}
                >
                  Direct Message
                </button>
                <button
                  type="button"
                  onClick={() => setChatType('group')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${chatType === 'group' ? 'bg-primary text-white' : 'bg-surface-hover text-muted hover:text-text'}`}
                >
                  Personal Group
                </button>
              </div>
              
              <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                {chatType === 'group' && (
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Group Name</label>
                    <input 
                      type="text" 
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                      placeholder="e.g. Study Buddies"
                      className="w-full bg-bg/50 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary transition-all"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Search Users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input 
                      type="text" 
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-bg/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted">Available Users</label>
                  {isSearchingUsers ? (
                    <div className="text-center py-4 text-muted text-sm">Loading users...</div>
                  ) : filteredAvailableUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted text-sm">No users found.</div>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar border border-border rounded-xl p-1 bg-bg/30">
                      {filteredAvailableUsers.map(u => {
                        const isSelected = selectedUsers.some(su => su.id === u.id);
                        return (
                          <div 
                            key={u.id}
                            onClick={() => toggleUserSelection(u)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-surface-hover'}`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt={u.name} className="w-8 h-8 rounded-full bg-surface" />
                              <div>
                                <p className="text-sm font-medium text-text">{u.name}</p>
                                <p className="text-xs text-muted">{u.email || 'No email'}</p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-3 shrink-0 bg-surface">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={selectedUsers.length === 0 || (chatType === 'group' && !newChatName.trim())}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {chatType === 'dm' ? 'Start Chat' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
