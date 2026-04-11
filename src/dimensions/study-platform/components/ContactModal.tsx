import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Search, Check, Users } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { User as UserType } from '../types';

interface ContactModalProps {
  currentUser: UserType;
  onClose: () => void;
  onSend: (contacts: UserType[]) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ currentUser, onClose, onSend }) => {
  const [connections, setConnections] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        // Fetch approved connection requests
        const q = query(
          collection(db, "connection_requests"),
          where("status", "==", "approved"),
          where("participants", "array-contains", currentUser.id)
        );
        const snapshot = await getDocs(q);
        const connectedUserIds = new Set<string>();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const otherId = data.participants.find((id: string) => id !== currentUser.id);
          if (otherId) connectedUserIds.add(otherId);
        });

        if (connectedUserIds.size === 0) {
          setConnections([]);
          setIsLoading(false);
          return;
        }

        // Fetch user details for connected IDs
        const usersQ = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQ);
        const connectedUsers = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as UserType))
          .filter(u => connectedUserIds.has(u.id));
        
        setConnections(connectedUsers);
      } catch (err) {
        console.error("Error fetching connections:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConnections();
  }, [currentUser.id]);

  const filteredUsers = connections.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSend = () => {
    const selectedList = connections.filter(u => selectedUsers.includes(u.id));
    if (selectedList.length > 0) {
      onSend(selectedList);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-text flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Share Connections
          </h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connections..."
            className="w-full bg-bg/50 border border-border rounded-xl pl-10 pr-3 py-3 text-sm text-text focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${selectedUsers.includes(user.id) ? 'bg-primary/10 border-primary' : 'bg-bg/50 border-border hover:border-primary/50'}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-text truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate">{user.location || 'No location'}</p>
                </div>
                {selectedUsers.includes(user.id) && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-muted text-sm">No connections found</div>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={selectedUsers.length === 0}
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          Share {selectedUsers.length} Connection{selectedUsers.length > 1 ? 's' : ''}
        </button>
      </div>
    </div>,
    document.body
  );
};
