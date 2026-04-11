import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Forward, Search, Check } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { PrivateChat, Group, Message } from '../types';

interface ForwardModalProps {
  message: Message;
  onClose: () => void;
  onForward: (chatIds: string[]) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ message, onClose, onForward }) => {
  const [chats, setChats] = useState<(PrivateChat | Group)[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const groupsSnapshot = await getDocs(query(collection(db, "groups")));
        const privateSnapshot = await getDocs(query(collection(db, "chats")));
        
        const groups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'group' } as any));
        const privateChats = privateSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'dm' } as any));
        
        setChats([...groups, ...privateChats]);
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  const filteredChats = chats.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleChat = (chatId: string) => {
    setSelectedChatIds(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId) 
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    if (selectedChatIds.length > 0) {
      onForward(selectedChatIds);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-text flex items-center gap-2">
            <Forward className="w-5 h-5 text-primary" /> Forward Message
          </h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-bg/50 p-3 rounded-xl border border-border mb-4">
          <p className="text-xs text-muted mb-1 uppercase font-bold">Message Preview</p>
          <p className="text-sm text-text truncate italic opacity-80">"{message.text}"</p>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-bg/50 border border-border rounded-xl pl-10 pr-3 py-3 text-sm text-text focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => toggleChat(chat.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${selectedChatIds.includes(chat.id) ? 'bg-primary/10 border-primary' : 'bg-bg/50 border-border hover:border-primary/50'}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-surface">
                  <img src={(chat as any).avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`} alt={chat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-text truncate">{chat.name || 'Unnamed Chat'}</p>
                  <p className="text-xs text-muted truncate capitalize">{(chat as any).type || 'Chat'}</p>
                </div>
                {selectedChatIds.includes(chat.id) && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-muted text-sm">No chats found</div>
          )}
        </div>

        <button
          onClick={handleForward}
          disabled={selectedChatIds.length === 0}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          Forward to {selectedChatIds.length} Chat{selectedChatIds.length > 1 ? 's' : ''}
        </button>
      </div>
    </div>,
    document.body
  );
};
