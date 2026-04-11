import React, { useState } from "react";
import { Search, Plus, Users, X, Menu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Group, User, Message } from "../types";
import ChatInterface from "./ChatInterface";
import { useRole } from "../../../contexts/RoleContext";

interface PublicGroupsViewProps {
  groups: Group[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  onJoinGroup: (id: string) => void;
  currentUser: User;
  messages: Record<string, Message[]>;
  onSendMessage: (text: string, file?: { url: string, name: string, type: string, size: number }, replyTo?: { id: string, text: string, senderName: string, senderId: string }, extraFields?: Partial<Message>) => void;
  onSendAIMessage?: (text: string) => void;
  onCreateGroup?: (name: string, topic: string, privacy: 'public' | 'private' | 'hidden') => void;
}

export default function PublicGroupsView({
  groups,
  activeChatId,
  setActiveChatId,
  onJoinGroup,
  currentUser,
  messages,
  onSendMessage,
  onSendAIMessage,
  onCreateGroup,
  onOpenSidebar
}: PublicGroupsViewProps & { onOpenSidebar?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private' | 'hidden'>('public');
  const { role } = useRole();
  
  const filteredGroups = groups.filter(g => (g.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const activeChat = groups.find(g => g.id === activeChatId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim() && newGroupTopic.trim() && onCreateGroup) {
      onCreateGroup(newGroupName.trim(), newGroupTopic.trim(), newGroupPrivacy);
      setNewGroupName('');
      setNewGroupTopic('');
      setNewGroupPrivacy('public');
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
              <h2 className="font-bold text-lg text-text">Global Groups</h2>
            </div>
            {(role === 'teacher' || role === 'admin') && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
                title="Create Group"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Find study groups..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-primary transition-all placeholder:text-muted/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 custom-scrollbar">
          {filteredGroups.map(group => (
            <div 
              key={group.id}
              onClick={() => group.isJoined && setActiveChatId(group.id)}
              className={`p-3 md:p-4 rounded-2xl border transition-all cursor-pointer ${activeChatId === group.id ? 'bg-primary/10 border-primary/50' : 'bg-surface/20 border-border hover:border-muted/30'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm text-text truncate pr-2">{group.name}</h4>
                {!group.isJoined && group.creatorId !== currentUser.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onJoinGroup(group.id); }}
                    className="text-[10px] font-bold uppercase tracking-wider bg-primary text-white px-2 py-1 rounded-md hover:opacity-90 shrink-0"
                  >
                    {group.privacy === 'private' ? 'Request' : 'Join'}
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {group.members}</span>
                <span className="bg-surface px-2 py-0.5 rounded-full truncate max-w-[100px] border border-border/50">{group.topic}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      {/* Right Chat */}
      <div className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 min-w-0 bg-bg relative z-10`}>
        {activeChat ? (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-200">
            <ChatInterface 
              chat={activeChat} 
              isPublic={true} 
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
              <Users className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Select a group</h3>
            <p className="text-sm text-muted max-w-xs">Choose a study group from the list to start collaborating in real-time.</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-text">Create Study Group</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted hover:text-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Group Name</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Advanced React Patterns"
                  className="w-full bg-bg/50 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Topic</label>
                <input 
                  type="text" 
                  value={newGroupTopic}
                  onChange={(e) => setNewGroupTopic(e.target.value)}
                  placeholder="e.g. Frontend"
                  className="w-full bg-bg/50 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Privacy</label>
                <select 
                  value={newGroupPrivacy}
                  onChange={(e) => setNewGroupPrivacy(e.target.value as any)}
                  className="w-full bg-bg/50 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary transition-all"
                >
                  <option value="public">Public (Anyone can join)</option>
                  <option value="private">Private (Approval required)</option>
                  <option value="hidden">Hidden (Invite only)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newGroupName.trim() || !newGroupTopic.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
