import React from 'react';
import { createPortal } from 'react-dom';
import { X, Sticker } from 'lucide-react';

interface StickerPickerProps {
  onClose: () => void;
  onSelect: (stickerUrl: string) => void;
}

const STICKER_PACKS = [
  {
    name: 'Study Buddies',
    stickers: [
      'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=study1',
      'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=study2',
      'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=study3',
      'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=study4',
      'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=study5',
      'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=study6',
    ]
  },
  {
    name: 'Reactions',
    stickers: [
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=wow',
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=cool',
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=love',
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=laugh',
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=sad',
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=angry',
    ]
  }
];

export const StickerPicker: React.FC<StickerPickerProps> = ({ onClose, onSelect }) => {
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-text flex items-center gap-2">
            <Sticker className="w-5 h-5 text-indigo-500" /> Stickers
          </h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
          {STICKER_PACKS.map(pack => (
            <div key={pack.name} className="space-y-4">
              <h4 className="text-xs font-bold text-muted uppercase tracking-widest px-1">{pack.name}</h4>
              <div className="grid grid-cols-3 gap-4">
                {pack.stickers.map((sticker, idx) => (
                  <button
                    key={idx}
                    onClick={() => { onSelect(sticker); onClose(); }}
                    className="aspect-square bg-bg/50 border border-border rounded-xl p-2 hover:border-primary transition-all flex items-center justify-center group"
                  >
                    <img src={sticker} alt="Sticker" className="w-full h-full object-contain group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
