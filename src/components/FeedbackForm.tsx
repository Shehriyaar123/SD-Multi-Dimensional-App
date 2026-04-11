import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bug, Lightbulb, CheckCircle2, Loader2 } from 'lucide-react';

export default function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature'>('feature');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Feedback submitted:', { type, message, email });
    setStatus('success');
    
    setTimeout(() => {
      setIsOpen(false);
      setStatus('idle');
      setMessage('');
      setEmail('');
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[90] w-14 h-14 bg-orange-500 hover:bg-orange-400 text-white rounded-full shadow-2xl shadow-orange-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
      >
        <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute right-full mr-4 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Give Feedback
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Feedback</h2>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Help us improve</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                {status === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold">Thank You!</h3>
                    <p className="text-zinc-400">Your feedback helps us build a better career platform.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setType('feature')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                          type === 'feature'
                            ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                            : 'bg-white/5 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-sm font-bold">Suggestion</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('bug')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                          type === 'bug'
                            ? 'bg-red-500/10 border-red-500 text-red-400'
                            : 'bg-white/5 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        <Bug className="w-4 h-4" />
                        <span className="text-sm font-bold">Report Bug</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Your Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full bg-white/5 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Message</label>
                      <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={type === 'feature' ? "What would you like to see?" : "What went wrong?"}
                        rows={4}
                        className="w-full bg-white/5 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
