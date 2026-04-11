import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, MapPin, Clock } from 'lucide-react';

interface EventModalProps {
  onClose: () => void;
  onSend: (title: string, date: string, location: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ onClose, onSend }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && date && time) {
      onSend(title, `${date}T${time}`, location);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-text flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" /> Create Event
          </h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-2 block">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the occasion?"
              className="w-full bg-bg/50 border border-border rounded-xl p-3 text-sm text-text focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted uppercase mb-2 block">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-bg/50 border border-border rounded-xl p-3 text-sm text-text focus:border-primary focus:outline-none appearance-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase mb-2 block">Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-bg/50 border border-border rounded-xl p-3 text-sm text-text focus:border-primary focus:outline-none appearance-none"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-2 block">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where is it?"
                className="w-full bg-bg/50 border border-border rounded-xl pl-10 pr-3 py-3 text-sm text-text focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:opacity-90 transition-all mt-4"
          >
            Create Event
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
