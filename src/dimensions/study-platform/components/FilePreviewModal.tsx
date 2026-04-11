import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, File, Send, Plus } from 'lucide-react';

interface FilePreviewModalProps {
  files: File[];
  onClose: () => void;
  onSend: (files: File[], captions: string[]) => void;
  onAddFiles: (newFiles: File[]) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ files, onClose, onSend, onAddFiles }) => {
  const [captions, setCaptions] = useState<string[]>(files.map(() => ''));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptionChange = (index: number, value: string) => {
    const newCaptions = [...captions];
    newCaptions[index] = value;
    setCaptions(newCaptions);
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length > 0) {
      onAddFiles(newFiles);
      setCaptions(prev => [...prev, ...newFiles.map(() => '')]);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-bold">Preview {files.length} File{files.length > 1 ? 's' : ''}</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white"><X className="w-6 h-6" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        {files.map((file, idx) => (
          <div key={idx} className="max-w-2xl mx-auto bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="p-6 flex flex-col items-center gap-4">
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt={file.name} className="max-h-[300px] rounded-lg object-contain" />
              ) : file.type.startsWith('video/') ? (
                <video src={URL.createObjectURL(file)} className="max-h-[300px] rounded-lg" controls />
              ) : (
                <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center">
                  <File className="w-12 h-12 text-white/40" />
                </div>
              )}
              <div className="text-center">
                <p className="text-white font-medium truncate max-w-xs">{file.name}</p>
                <p className="text-white/40 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <div className="p-4 bg-black/20 border-t border-white/5">
              <input 
                type="text"
                value={captions[idx]}
                onChange={(e) => handleCaptionChange(idx, e.target.value)}
                placeholder="Add a caption..."
                className="w-full bg-transparent border-none text-white placeholder:text-white/20 focus:ring-0 text-sm"
              />
            </div>
          </div>
        ))}
        
        <div className="flex justify-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/10 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            <Plus className="w-5 h-5" /> Add More Images
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAddFiles} 
            className="hidden" 
            multiple 
            accept="image/*,video/*"
          />
        </div>
      </div>

      <div className="p-6 border-t border-white/10 flex justify-center">
        <button 
          onClick={() => onSend(files, captions)}
          className="bg-primary text-white px-12 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-primary/20"
        >
          <Send className="w-5 h-5" /> Send All
        </button>
      </div>
    </div>,
    document.body
  );
};
