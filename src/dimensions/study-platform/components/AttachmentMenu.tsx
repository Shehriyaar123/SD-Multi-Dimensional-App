import React from 'react';
import { File, Image, Camera, Music, User, BarChart3, Calendar, Sticker, X } from 'lucide-react';

interface AttachmentMenuProps {
  onClose: () => void;
  onSelect: (type: 'document' | 'media' | 'camera' | 'audio' | 'contact' | 'poll' | 'event' | 'sticker') => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ onClose, onSelect }) => {
  const items = [
    { id: 'document', icon: File, label: 'Document', color: 'bg-indigo-500' },
    { id: 'media', icon: Image, label: 'Photos & Videos', color: 'bg-purple-500' },
    { id: 'camera', icon: Camera, label: 'Camera', color: 'bg-pink-500' },
    { id: 'audio', icon: Music, label: 'Audio', color: 'bg-orange-500' },
    { id: 'contact', icon: User, label: 'Connections', color: 'bg-blue-500' },
    { id: 'poll', icon: BarChart3, label: 'Poll', color: 'bg-emerald-500' },
    { id: 'event', icon: Calendar, label: 'Event', color: 'bg-amber-500' },
    { id: 'sticker', icon: Sticker, label: 'Sticker', color: 'bg-teal-500' },
  ];

  return (
    <div className="absolute bottom-full mb-2 left-0 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xl w-72">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-sm font-bold text-text">Attachments</span>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.id as any);
                onClose();
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-muted group-hover:text-text transition-colors text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
