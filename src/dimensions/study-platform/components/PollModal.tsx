import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';

interface PollModalProps {
  onClose: () => void;
  onSend: (question: string, options: string[]) => void;
}

export const PollModal: React.FC<PollModalProps> = ({ onClose, onSend }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (question.trim() && validOptions.length >= 2) {
      onSend(question, validOptions);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-text">Create Poll</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-2 block">Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-bg/50 border border-border rounded-xl p-3 text-sm text-text focus:border-primary focus:outline-none resize-none"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-2 block">Options</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 bg-bg/50 border border-border rounded-xl p-3 text-sm text-text focus:border-primary focus:outline-none"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 flex items-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Add Option
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            Create Poll
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
