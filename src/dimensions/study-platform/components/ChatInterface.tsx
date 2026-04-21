import EmojiPicker, { Theme } from 'emoji-picker-react';
import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from 'motion/react';

const PortalModal = ({ children }: { children: React.ReactNode }) => {
  return createPortal(children, document.body);
};
import { FilePreviewModal } from './FilePreviewModal';
import { AttachmentMenu } from './AttachmentMenu';
import { PollModal } from './PollModal';
import { EventModal } from './EventModal';
import { ContactModal } from './ContactModal';
import { AudioRecorder } from './AudioRecorder';
import { ForwardModal } from './ForwardModal';
import { StickerPicker } from './StickerPicker';
import { CameraModal } from './CameraModal';
import { ImageLightbox } from './ImageLightbox';
import { ArrowLeft, Hash, Clock, Phone, Video, Info, Globe, MapPin, Plus, Send, MessageSquare, Sparkles, File, X, Bot, Shield, Languages, Lock, Unlock, UserPlus, UserMinus, Settings as SettingsIcon, ShieldCheck, ShieldAlert, Check, CheckCheck, Trash2, EyeOff, Pin, Reply, Flag, Ban, Layout, BarChart3, Calendar, Activity, Users, Search, Smile, Palette, MoreVertical, User as UserIcon, ChevronRight, Bell, BellOff, Ghost, Edit, Copy, ChevronDown, Download, Mic, Music, Sticker, Image as ImageIcon, Camera, Forward, Play, Pause } from "lucide-react";
import { User, Message, Group, OperationType, FirestoreErrorInfo } from "../types";
import { askGemini, performNLPTask, translateText } from "../../../services/aiService";
import { encryptMessage, decryptMessage, isEncrypted } from "../../../lib/encryption";
import { useSettings } from "../../../contexts/SettingsContext";
import { SUPPORTED_LANGUAGES } from "../../../constants/languages";
import { GoogleGenAI } from "@google/genai";
import { db, auth, storage } from "../../../firebase";
import { collection, query, getDocs, getDoc, doc, updateDoc, arrayUnion, arrayRemove, deleteField, addDoc, serverTimestamp, where, orderBy, onSnapshot, deleteDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Helper for relative time
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'just now';
  if (diffInSeconds < 60) return 'less than a minute ago';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  const diffInWeeksNum = Math.floor(diffInDays / 7);
  if (diffInWeeksNum < 4) return `${diffInWeeksNum}w ago`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const isVideo = (type?: string, url?: string, name?: string) => {
  if (type?.startsWith('video/') || type === 'video') return true;
  const lowerUrl = url?.toLowerCase() || '';
  const lowerName = name?.toLowerCase() || '';
  if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg') || lowerUrl.includes('.mov')) return true;
  if (lowerName.endsWith('.mp4') || lowerName.endsWith('.webm') || lowerName.endsWith('.ogg') || lowerName.endsWith('.mov')) return true;
  return false;
};

const isImage = (type?: string, url?: string, name?: string) => {
  if (type?.startsWith('image/') || type === 'image') return true;
  const lowerUrl = url?.toLowerCase() || '';
  const lowerName = name?.toLowerCase() || '';
  if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || lowerUrl.includes('.gif') || lowerUrl.includes('.webp') || lowerUrl.includes('.svg')) return true;
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.gif') || lowerName.endsWith('.webp') || lowerName.endsWith('.svg')) return true;
  return false;
};

interface ChatInterfaceProps {
  chat: any;
  isPublic: boolean;
  currentUser: User;
  messages: Message[];
  onSendMessage: (text: string, file?: { url: string, name: string, type: string, size: number }, replyTo?: { id: string, text: string, senderName: string, senderId: string }, extraFields?: Partial<Message>) => void;
  onSendAIMessage?: (text: string) => void;
  onBack: () => void;
  onLoadMore?: () => void;
}

const getEmojiCount = (text: string) => {
  if (!text) return 0;
  // This regex matches most emojis including ZWJ sequences and skin tones
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  const matches = text.match(emojiRegex);
  const textWithoutEmojis = text.replace(emojiRegex, '').replace(/\s/g, '').trim();
  if (textWithoutEmojis.length === 0 && matches) {
    return matches.length;
  }
  return 0;
};

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface DecryptedMessageProps {
  msg: Message;
  currentUser: any;
  isPublic: boolean;
  chat: any;
  encryptionKey: string | null;
  isSecureMode: boolean;
  localLanguage: string | null;
  globalLanguage: string | null;
  nicknames: Record<string, string>;
  translatedMessages: Record<string, string>;
  isTranslating: string | null;
  handleTranslate: (msgId: string, text: string) => void;
  triggerEdit: (msg: Message) => void;
  setReplyToMessage: (msg: Message | null) => void;
  handleReportMessage: (msgId: string, reason?: string) => void;
  handleSetNickname: (userId: string, currentName: string) => void;
  isAdmin?: boolean;
  handlePinMessage?: (msgId: string) => void;
  handleForwardMessage: (msg: Message) => void;
  actionsOpenMsgId: string | null;
  setActionsOpenMsgId: (id: string | null) => void;
  isAttachmentMenuOpen?: boolean;
  setLightboxUrl: (url: string | null) => void;
}

const AudioPlayer = ({ url, duration }: { url: string, duration?: number }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const onEnded = () => setIsPlaying(false);

  return (
    <div className="flex items-center gap-3 bg-bg/50 p-3 rounded-xl border border-border">
      <audio ref={audioRef} src={url} onTimeUpdate={onTimeUpdate} onEnded={onEnded} className="hidden" />
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 h-1 bg-border rounded-full relative overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-orange-500 transition-all duration-100" 
          style={{ width: `${(currentTime / (duration || audioRef.current?.duration || 1)) * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-muted font-mono shrink-0">
        {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
      </span>
    </div>
  );
};

const DecryptedMessage = ({ 
  msg, 
  currentUser, 
  isPublic, 
  chat, 
  encryptionKey, 
  isSecureMode, 
  localLanguage, 
  globalLanguage, 
  nicknames, 
  translatedMessages, 
  isTranslating, 
  handleTranslate, 
  triggerEdit, 
  setReplyToMessage, 
  handleReportMessage, 
  handleSetNickname,
  isAdmin,
  handlePinMessage,
  handleForwardMessage,
  actionsOpenMsgId,
  setActionsOpenMsgId,
  isAttachmentMenuOpen,
  setLightboxUrl
}: DecryptedMessageProps) => {
  const [decryptedText, setDecryptedText] = useState<string | null>(msg.text.startsWith('[SECURE]') ? null : msg.text);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'unsend' | 'delete' | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  const [dropdownAlignment, setDropdownAlignment] = useState<'left' | 'right'>('right');
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useSettings();

  const showActions = actionsOpenMsgId === msg.id;
  const setShowActions = (val: boolean) => setActionsOpenMsgId(val ? msg.id : null);

  useEffect(() => {
    if (actionsOpenMsgId === msg.id && actionButtonRef.current) {
      const rect = actionButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      setDropdownDirection(spaceBelow < 250 && spaceAbove > spaceBelow ? 'up' : 'down');
      setDropdownAlignment(spaceRight < 200 ? 'right' : (spaceLeft < 200 ? 'left' : 'right'));
      
      // Calculate picker position for Portal
      const top = spaceBelow < 450 && spaceAbove > spaceBelow 
        ? rect.top - 410 // up
        : rect.bottom + 10; // down
      
      let left = rect.left;
      if (rect.left + 320 > window.innerWidth) {
        left = window.innerWidth - 330;
      }
      if (left < 10) left = 10;
      
      setPickerPosition({ top, left });
    }
  }, [actionsOpenMsgId, msg.id]);

  // Calculate if message is editable (within 15 mins)
  let isEditable = false;
  if (msg.createdAt) {
    try {
      const msgDate = msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt as any);
      if (!isNaN(msgDate.getTime())) {
        const diffInMinutes = (new Date().getTime() - msgDate.getTime()) / (1000 * 60);
        isEditable = diffInMinutes <= 15;
      }
    } catch (e) {
      console.warn("Could not verify message age for editing:", e);
    }
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const effectiveLang = localLanguage || globalLanguage;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowActions(false);
        setShowEmojiPicker(false);
      }
    };
    if (showActions || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions, showEmojiPicker]);

  useEffect(() => {
    const processMessage = async () => {
      if (msg.text.startsWith('[SECURE]')) {
        if (!isSecureMode || !encryptionKey) {
          setDecryptedText(null);
          setError("Encrypted message. Enable Secure Mode with the correct key to read.");
          return;
        }
        try {
          const encryptedData = msg.text.replace('[SECURE]', '');
          const decrypted = await decryptMessage(encryptedData, encryptionKey);
          setDecryptedText(decrypted);
          setError(null);
        } catch (err) {
          setDecryptedText(null);
          setError("Decryption failed. Incorrect key?");
        }
      } else {
        setDecryptedText(msg.text);
        setError(null);
      }
    };
    processMessage();
  }, [msg.text, isSecureMode, encryptionKey]);

  const cacheKey = msg.id + '_' + (decryptedText || '');

  // Auto-translate if global or local language is set
  useEffect(() => {
    if (decryptedText && effectiveLang && !translatedMessages[cacheKey]) {
      handleTranslate(cacheKey, decryptedText);
    }
  }, [decryptedText, effectiveLang, handleTranslate, cacheKey, translatedMessages]);

  const displayText = translatedMessages[cacheKey] || decryptedText;

  const [viewingVoters, setViewingVoters] = useState<{question: string, option: string, voters: string[]} | null>(null);

  const handleVote = async (optionIndex: number) => {
    const msgRef = doc(db, isPublic ? "groups" : "chats", chat.id, "messages", msg.id);
    
    const newOptions = [...(msg.options || [])];
    
    // Remove user's vote from all options
    newOptions.forEach(opt => {
      opt.votes = (opt.votes || []).filter(uid => uid !== currentUser.id);
    });
    
    // Add user's vote to the selected option
    newOptions[optionIndex].votes = [...(newOptions[optionIndex].votes || []), currentUser.id];
    
    await updateDoc(msgRef, { options: newOptions });
  };

  const renderSpecialContent = () => {
    if (msg.type === 'mediaGroup' && msg.mediaUrls) {
      const count = msg.mediaUrls.length;
      return (
        <div className="space-y-2">
          <div className={`grid gap-0.5 rounded-xl overflow-hidden ${
            count === 1 ? 'grid-cols-1' : 
            count === 2 ? 'grid-cols-2' : 
            count === 3 ? 'grid-cols-2' : 
            'grid-cols-2'
          } max-w-[280px] md:max-w-[320px]`}>
            {msg.mediaUrls.slice(0, 4).map((url, idx) => (
              <div 
                key={idx} 
                className={`relative group/media cursor-pointer hover:opacity-90 transition-opacity ${
                  count === 3 && idx === 0 ? 'row-span-2 h-full' : 'aspect-square'
                }`}
              >
                {isVideo(msg.mediaTypes?.[idx], url) ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onClick={() => setLightboxUrl(url)} />
                )}
                {idx === 3 && count > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl backdrop-blur-[2px]">
                    +{count - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
          {msg.caption && <p className="text-sm px-3 py-1 pb-2">{msg.caption}</p>}
        </div>
      );
    }

    if (msg.fileUrl) {
      if (isImage(msg.fileType, msg.fileUrl, msg.fileName) || isVideo(msg.fileType, msg.fileUrl, msg.fileName)) {
        return (
          <div className="space-y-2 max-w-[280px] md:max-w-[320px]">
            <div className="rounded-xl overflow-hidden border border-border/50 bg-black/5 shadow-inner">
              {isVideo(msg.fileType, msg.fileUrl, msg.fileName) ? (
                <video src={msg.fileUrl} controls className="w-full max-h-[450px] object-contain" />
              ) : (
                <img 
                  src={msg.fileUrl} 
                  alt="" 
                  className="w-full max-h-[450px] object-contain cursor-pointer" 
                  referrerPolicy="no-referrer" 
                  onClick={() => setLightboxUrl(msg.fileUrl || null)}
                />
              )}
            </div>
            {msg.caption && <p className="text-sm px-3 py-1 pb-2">{msg.caption}</p>}
          </div>
        );
      }

      // Fallback for other file types
      return (
        <div className="space-y-2 max-w-[280px] md:max-w-[320px]">
          <a 
            href={msg.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-border hover:border-primary transition-all group/file"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/file:bg-primary group-hover/file:text-white transition-colors">
              <File className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{msg.fileName || 'Shared File'}</p>
              <p className="text-[10px] text-muted uppercase">{(msg.fileSize ? (msg.fileSize / 1024).toFixed(1) : 0)} KB</p>
            </div>
            <Download className="w-4 h-4 text-muted group-hover/file:text-primary transition-colors" />
          </a>
          {msg.caption && <p className="text-sm px-3 py-1 pb-2">{msg.caption}</p>}
        </div>
      );
    }
    if (msg.type === 'poll') {
      return (
        <div className="space-y-3 p-2 min-w-[200px]">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] uppercase tracking-wider">
            <BarChart3 className="w-3 h-3" /> Poll
          </div>
          <p className="font-bold text-sm text-text">{msg.question}</p>
          <div className="space-y-1.5">
            {msg.options?.map((opt, idx) => (
              <div key={idx} className="space-y-1">
                <button 
                  className={`w-full p-2 rounded-lg bg-bg/50 border ${opt.votes?.includes(currentUser.id) ? 'border-primary' : 'border-border'} text-left text-xs hover:border-primary transition-all flex items-center justify-between`}
                  onClick={() => handleVote(idx)}
                >
                  <span className="truncate mr-2">{opt.text}</span>
                  <span 
                    className="text-[10px] text-muted shrink-0 cursor-pointer hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingVoters({ question: msg.question || '', option: opt.text, voters: opt.votes || [] });
                    }}
                  >
                    {opt.votes?.length || 0} votes
                  </span>
                </button>
              </div>
            ))}
          </div>

          {/* Voters Modal */}
          {viewingVoters && (
            <PortalModal>
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingVoters(null)}>
                <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-text mb-2">{viewingVoters.question}</h3>
                  <p className="text-sm text-muted mb-4">Voters for: <span className="font-bold text-text">{viewingVoters.option}</span></p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {viewingVoters.voters.map(uid => (
                      <div key={uid} className="flex items-center gap-2 text-sm text-text">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                          {(nicknames[uid] || 'U')[0]}
                        </div>
                        {uid === currentUser.id ? 'You' : (nicknames[uid] || 'User')}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setViewingVoters(null)}
                    className="w-full mt-6 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:opacity-90 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </PortalModal>
          )}
        </div>
      );
    }

    if (msg.type === 'event') {
      return (
        <div className="space-y-3 p-2 min-w-[200px]">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
            <Calendar className="w-3 h-3" /> Event
          </div>
          <p className="font-bold text-sm text-text">{msg.eventTitle}</p>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock className="w-3 h-3" /> {msg.eventDate}
          </div>
          <button className="w-full py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-all">
            Add to Calendar
          </button>
        </div>
      );
    }

    if (msg.type === 'contact') {
      return (
        <div className="space-y-3 p-2 min-w-[200px]">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] uppercase tracking-wider">
            <UserIcon className="w-3 h-3" /> Contact
          </div>
          <div className="flex items-center gap-3 bg-bg/50 p-2 rounded-xl border border-border">
            <img src={msg.contact?.avatar} alt={msg.contact?.name} className="w-10 h-10 rounded-full bg-surface" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text truncate">{msg.contact?.name}</p>
            </div>
          </div>
          <button className="w-full py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold hover:opacity-90 transition-all">
            Message
          </button>
        </div>
      );
    }

    if (msg.type === 'audio') {
      return (
        <div className="space-y-2 p-2 min-w-[240px]">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-[10px] uppercase tracking-wider">
            <Mic className="w-3 h-3" /> Voice Note
          </div>
          <AudioPlayer url={msg.audioUrl!} duration={msg.audioDuration} />
        </div>
      );
    }

    if (msg.type === 'sticker') {
      return (
        <div className="p-1">
          <img src={msg.stickerUrl} alt="Sticker" className="w-32 h-32 object-contain" referrerPolicy="no-referrer" />
        </div>
      );
    }

    return null;
  };

  const handleAction = async (action: 'unsend' | 'delete' | 'reply' | 'react' | 'nickname' | 'report' | 'copy' | 'edit' | 'pin' | 'forward' | 'info', emoji?: string) => {
    if (action === 'unsend' || action === 'delete') {
      setConfirmAction(action);
      setShowActions(false);
      return;
    }
    if (action === 'report') {
      setIsReporting(true);
      setShowActions(false);
      return;
    }
    if (action === 'info') {
      setShowMessageInfo(true);
      setShowActions(false);
      return;
    }
    if (action === 'forward') {
      handleForwardMessage(msg);
      setShowActions(false);
      return;
    }

    const msgRef = doc(db, isPublic ? "groups" : "chats", chat.id, "messages", msg.id);
    const path = (isPublic ? "groups" : "chats") + "/" + chat.id + "/messages/" + msg.id;
    try {
      if (action === 'copy') {
        await navigator.clipboard.writeText(decryptedText || msg.text);
        addDoc(collection(db, "system_logs"), {
          userId: currentUser.id,
          userName: currentUser.name,
          action: `Copied message text in ${isPublic ? 'group' : 'chat'} ${chat.id}`,
          timestamp: serverTimestamp(),
          type: 'info',
          dimension: 'Study'
        });
      } else if (action === 'edit') {
        triggerEdit(msg);
      } else if (action === 'reply') {
        setReplyToMessage(msg);
      } else if (action === 'react' && emoji) {
        await updateDoc(msgRef, { [`reactions.${currentUser.id}`]: emoji });
        addDoc(collection(db, "system_logs"), {
          userId: currentUser.id,
          userName: currentUser.name,
          action: `Reacted with ${emoji} to message in ${isPublic ? 'group' : 'chat'} ${chat.id}`,
          timestamp: serverTimestamp(),
          type: 'success',
          dimension: 'Study'
        });
      } else if (action === 'nickname') {
        handleSetNickname(msg.senderId, msg.senderName);
      } else if (action === 'pin' && handlePinMessage) {
        handlePinMessage(msg.id);
      }
      setShowActions(false);
      setShowEmojiPicker(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const confirmDeleteOrUnsend = async () => {
    if (!confirmAction) return;
    const msgRef = doc(db, isPublic ? "groups" : "chats", chat.id, "messages", msg.id);
    const path = (isPublic ? "groups" : "chats") + "/" + chat.id + "/messages/" + msg.id;
    try {
      if (confirmAction === 'unsend') {
        await deleteDoc(msgRef);
        addDoc(collection(db, "system_logs"), {
          userId: currentUser.id,
          userName: currentUser.name,
          action: `Unsent message in ${isPublic ? 'group' : 'chat'} ${chat.id}`,
          timestamp: serverTimestamp(),
          type: 'warning',
          dimension: 'Study'
        });
      } else if (confirmAction === 'delete') {
        await updateDoc(msgRef, { deletedFor: arrayUnion(currentUser.id) });
        addDoc(collection(db, "system_logs"), {
          userId: currentUser.id,
          userName: currentUser.name,
          action: `Deleted message for self in ${isPublic ? 'group' : 'chat'} ${chat.id}`,
          timestamp: serverTimestamp(),
          type: 'info',
          dimension: 'Study'
        });
      }
    } catch (error) {
      handleFirestoreError(error, confirmAction === 'unsend' ? OperationType.DELETE : OperationType.UPDATE, path);
    } finally {
      setConfirmAction(null);
    }
  };

  const submitReport = () => {
    handleReportMessage(msg.id, reportReason);
    setIsReporting(false);
    setReportReason('');
  };

  const isMe = msg.senderId === currentUser.id;

  return (
    <div className={`relative group ${isAttachmentMenuOpen ? 'pointer-events-none' : ''}`} ref={containerRef}>
      {msg.replyTo && (
        <div className={`text-[10px] md:text-xs opacity-70 mb-2 p-2 rounded-lg border-l-2 ${isMe ? 'border-white/50 bg-white/10' : 'border-primary bg-bg/50 backdrop-blur-sm'}`}>
          <span className={`font-bold ${isMe ? '' : 'text-primary'}`}>
            {msg.replyTo.senderId === currentUser.id ? 'You' : (nicknames[msg.replyTo.senderId] || msg.replyTo.senderName)}
          </span>
          <p className="truncate opacity-80">{msg.replyTo.text}</p>
        </div>
      )}
      <div className="relative">
        {renderSpecialContent()}
        
        {decryptedText === null && !error && (
          <p className="text-sm italic opacity-40 p-2">Processing...</p>
        )}

        {error && (
          <p className="text-xs italic opacity-60 flex items-center gap-1 p-2">
            <Lock className="w-3 h-3" /> {error}
          </p>
        )}

        {decryptedText && (
          <div className={`leading-relaxed break-words whitespace-pre-wrap p-2 ${
            (() => {
              const count = getEmojiCount(decryptedText);
              if (count === 1) return 'text-5xl md:text-6xl text-center py-4';
              if (count === 2) return 'text-4xl md:text-5xl text-center py-3';
              return 'text-sm md:text-base';
            })()
          }`}>
            {msg.text.startsWith('[SECURE]') && <Shield className="w-3 h-3 inline mr-1 text-emerald-400" />}
            {displayText}
          </div>
        )}
        
        {/* Action Trigger */}
        {!isAttachmentMenuOpen && (
          <div className={`absolute -top-1 -right-1 z-30`}>
            <button 
              ref={actionButtonRef}
              onClick={() => setShowActions(!showActions)} 
              className={`p-1 rounded-full bg-surface/40 backdrop-blur-md border border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-surface/80 hover:scale-110 ${showActions ? 'opacity-100 rotate-180' : ''}`}
            >
              <ChevronDown className="w-3.5 h-3.5 text-text/70" />
            </button>
          
          <AnimatePresence>
            {showActions && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: dropdownDirection === 'up' ? 10 : -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: dropdownDirection === 'up' ? 10 : -10 }}
                className={`absolute ${dropdownDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${dropdownAlignment === 'right' ? 'right-0' : 'left-0'} bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 min-w-[190px] overflow-hidden ring-1 ring-black/20`}
              >
                {/* Caret */}
                <div className={`absolute ${dropdownDirection === 'up' ? '-bottom-1' : '-top-1'} ${dropdownAlignment === 'right' ? 'right-3' : 'left-3'} w-2 h-2 bg-surface border-l border-t border-white/10 rotate-[225deg] ${dropdownDirection === 'up' ? 'rotate-[45deg]' : 'rotate-[225deg]'} z-0`} />
                
                <div className="flex flex-col gap-0.5 relative z-10">
                  <button onClick={() => handleAction('copy')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm flex items-center gap-3 text-text/90 transition-colors"><Copy className="w-4 h-4 opacity-60" /> Copy Text</button>
                  <button onClick={() => handleAction('info')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm flex items-center gap-3 text-text/90 transition-colors"><Info className="w-4 h-4 opacity-60" /> Message Info</button>
                  <button onClick={() => handleAction('reply')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm flex items-center gap-3 text-text/90 transition-colors"><Reply className="w-4 h-4 opacity-60" /> Reply</button>
                  <button onClick={() => handleAction('forward')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm flex items-center gap-3 text-text/90 transition-colors"><Forward className="w-4 h-4 opacity-60" /> Forward</button>
                  <button onClick={() => handleAction('report')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm flex items-center gap-3 text-text/90 transition-colors"><Flag className="w-4 h-4 opacity-60" /> Report</button>
                  <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowActions(false); }} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm flex items-center gap-3 text-text/90 transition-colors"><Smile className="w-4 h-4 opacity-60" /> React</button>
                  
                  {isAdmin && isPublic && (
                    <button onClick={() => handleAction('pin')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm flex items-center gap-3 text-text/90 transition-colors"><Pin className="w-4 h-4 opacity-60" /> {chat?.pinnedPosts?.includes(msg.id) ? 'Unpin' : 'Pin'}</button>
                  )}
                  
                  <div className="h-px bg-white/5 my-1 mx-2" />
                  
                  {isMe && (
                    <>
                      {isEditable && (
                        <button onClick={() => handleAction('edit')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm flex items-center gap-3 text-text/90 transition-colors"><Edit className="w-4 h-4 opacity-60" /> Edit Message</button>
                      )}
                      <button onClick={() => handleAction('unsend')} className="w-full text-left px-3 py-2.5 hover:bg-red-500/10 rounded-lg text-sm flex items-center gap-3 text-red-400 transition-colors"><Trash2 className="w-4 h-4" /> Unsend</button>
                    </>
                  )}
                  <button onClick={() => handleAction('delete')} className="w-full text-left px-3 py-2.5 hover:bg-red-500/10 rounded-lg text-sm flex items-center gap-3 text-red-400 transition-colors"><EyeOff className="w-4 h-4" /> Delete for me</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showEmojiPicker && (
              <PortalModal>
                <div 
                  className="fixed z-[9999]"
                  style={{ top: pickerPosition.top, left: pickerPosition.left }}
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 20 : -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 20 : -20 }}
                  >
                    <div className="relative bg-surface rounded-2xl shadow-2xl border border-border p-1 ring-1 ring-black/20">
                      <div className="absolute top-2 right-2 z-10">
                        <button 
                          onClick={() => setShowEmojiPicker(false)}
                          className="p-1.5 bg-bg/60 backdrop-blur-md text-muted hover:text-text rounded-full transition-colors border border-border"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="relative z-0">
                        <EmojiPicker 
                          onEmojiClick={(emoji) => {
                            handleAction('react', emoji.emoji);
                            setShowEmojiPicker(false);
                          }}
                          theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                          width={320}
                          height={400}
                          skinTonesDisabled
                          searchDisabled={false}
                          lazyLoadEmojis={true}
                          previewConfig={{ showPreview: false }}
                          autoFocusSearch={false}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </PortalModal>
            )}
          </AnimatePresence>
        </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      {confirmAction && (
        <PortalModal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-text mb-2">
                {confirmAction === 'unsend' ? 'Unsend Message?' : 'Delete for me?'}
              </h3>
              <p className="text-sm text-muted mb-6">
                {confirmAction === 'unsend' 
                  ? "This will remove the message for everyone in the chat. This action cannot be undone." 
                  : "This will remove the message from your view only. Other participants will still see it."}
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-text hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteOrUnsend}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  {confirmAction === 'unsend' ? 'Unsend' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Report Dialog */}
      {isReporting && (
        <PortalModal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-text mb-2">Report Message</h3>
              <p className="text-sm text-muted mb-4">Please provide a reason for reporting this message to the moderators.</p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for reporting..."
                className="w-full bg-bg/50 border border-border rounded-xl p-3 text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-24 mb-6"
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => { setIsReporting(false); setReportReason(''); }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-text hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitReport}
                  disabled={!reportReason.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Message Info Dialog */}
      {showMessageInfo && (
        <PortalModal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text">Message Info</h3>
                <button onClick={() => setShowMessageInfo(false)} className="p-2 hover:bg-bg rounded-full transition-colors">
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-bg/50 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Sent At (Your Time)</p>
                      <p className="text-sm font-bold text-text">
                        {msg.createdAt ? (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt as any)).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : msg.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg/50 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Sender's Local Time</p>
                      <p className="text-sm font-bold text-text">{msg.localTime} ({msg.timezone})</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg/50 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Sender's Location</p>
                      <p className="text-sm font-bold text-text">{msg.location || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowMessageInfo(false)}
                className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Close
              </button>
            </div>
          </div>
        </PortalModal>
      )}

      {translatedMessages[cacheKey] && (
        <p className="text-[10px] opacity-50 flex items-center gap-1 italic">
          <Languages className="w-3 h-3" /> Translated to {effectiveLang}
        </p>
      )}
      {!translatedMessages[cacheKey] && effectiveLang && (
        <button 
          onClick={() => handleTranslate(cacheKey, decryptedText || msg.text)}
          disabled={isTranslating === cacheKey}
          className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
        >
          <Languages className="w-3 h-3" /> {isTranslating === cacheKey ? 'Translating...' : 'Translate'}
        </button>
      )}
    </div>
  );
};

interface MessageContentProps extends DecryptedMessageProps {}

const MessageContent = (props: MessageContentProps) => {
  return <DecryptedMessage {...props} />;
};

export default function ChatInterface({ chat, isPublic, currentUser, messages, onSendMessage: onSendMessageProp, onSendAIMessage, onBack, onLoadMore }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputEmojiPickerPos, setInputEmojiPickerPos] = useState({ top: 0, left: 0 });
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);
  const [isThemesOpen, setIsThemesOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [reactingToMsgId, setReactingToMsgId] = useState<string | null>(null);
  const [actionsOpenMsgId, setActionsOpenMsgId] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState<'audio' | 'video' | null>(null);
  const [chatHistoryIds, setChatHistoryIds] = useState<number[] | null>(null);
  const [buddyMessages, setBuddyMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [buddyInput, setBuddyInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [buddyStatus, setBuddyStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { globalLanguage, setGlobalLanguage, securitySettings, appCustomization, theme } = useSettings();
  const [encryptionKey, setEncryptionKey] = useState(securitySettings.defaultEncryptionKey || '');
  const [isSecureMode, setIsSecureMode] = useState(!!securitySettings.defaultEncryptionKey);
  const [localLanguage, setLocalLanguage] = useState<string | null>(null);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const buddyScrollRef = useRef<HTMLDivElement>(null);

  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [isMeTyping, setIsMeTyping] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const lastScrollHeight = useRef(0);

  const displayMessages = useMemo(() => {
    const claimedTempIds = new Set<string>();
    
    const confirmed = messages.map(msg => {
      const matchingPending = pendingMessages.find(p => 
        !claimedTempIds.has(p.id) && 
        (msg.clientGeneratedId ? p.id === msg.clientGeneratedId : (p.text === msg.text && p.senderId === msg.senderId))
      );
      
      if (matchingPending) {
        claimedTempIds.add(matchingPending.id);
        return { ...msg, stableKey: matchingPending.id };
      }
      return msg;
    });

    const stillPending = pendingMessages.filter(p => !claimedTempIds.has(p.id));

    return [...confirmed, ...stillPending];
  }, [messages, pendingMessages]);

  useEffect(() => {
    setIsInitialScrollDone(false);
  }, [chat?.id]);

  useEffect(() => {
    if (scrollContainerRef.current && !isInitialScrollDone && displayMessages.length > 0) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      setIsInitialScrollDone(true);
    }
  }, [displayMessages.length, isInitialScrollDone]);

  const handleScroll = () => {
    if (!scrollContainerRef.current || !onLoadMore || isLoadingMore) return;
    
    if (scrollContainerRef.current.scrollTop <= 50) {
      lastScrollHeight.current = scrollContainerRef.current.scrollHeight;
      setIsLoadingMore(true);
      onLoadMore();
      // Reset loading state after a delay to prevent multiple calls
      setTimeout(() => setIsLoadingMore(false), 1000);
    }
  };

  // Adjust scroll position after loading more messages to maintain context
  useEffect(() => {
    if (isLoadingMore && scrollContainerRef.current && lastScrollHeight.current > 0) {
      const newHeight = scrollContainerRef.current.scrollHeight;
      const heightDiff = newHeight - lastScrollHeight.current;
      if (heightDiff > 0) {
        scrollContainerRef.current.scrollTop = heightDiff;
        lastScrollHeight.current = 0;
      }
    }
  }, [displayMessages.length]);

  // Close emoji picker and actions on click away
  useEffect(() => {
    const handleClickAway = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node) && 
          emojiButtonRef.current && !emojiButtonRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickAway);

      // Update position for input emoji picker
      if (emojiButtonRef.current) {
        const rect = emojiButtonRef.current.getBoundingClientRect();
        setInputEmojiPickerPos({
          top: rect.top - 410,
          left: Math.min(rect.left, window.innerWidth - 330)
        });
      }
    }
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showEmojiPicker]);

  const onSendMessage = async (text: string, file?: any, replyTo?: any, extraFields?: any) => {
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const optimisticMsg: Message = {
      id: tempId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      avatar: currentUser.avatar,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timezone: currentUser.timezone || '',
      location: currentUser.location || '',
      localTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      createdAt: { toDate: () => new Date() } as any,
      ...(file && {
        fileUrl: file.url,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }),
      ...(replyTo && { replyTo }),
      ...extraFields
    };

    setPendingMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setReplyToMessage(null);

    try {
      await onSendMessageProp(text, file, replyTo, { ...extraFields, clientGeneratedId: tempId });
    } catch (err) {
      console.error("Failed to send message:", err);
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNicknameUserId, setEditingNicknameUserId] = useState<string | null>(null);
  const [newNicknameValue, setNewNicknameValue] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isVanishMode, setIsVanishMode] = useState(false);
  const [showSharedFiles, setShowSharedFiles] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isChatControlsOpen, setIsChatControlsOpen] = useState(false);
  const [isPrivacySafetyOpen, setIsPrivacySafetyOpen] = useState(false);
  const [viewingVoters, setViewingVoters] = useState<{question: string, option: string, voters: string[]} | null>(null);
  const [hiddenWords, setHiddenWords] = useState<string[]>([]);
  const [newHiddenWord, setNewHiddenWord] = useState('');

  useEffect(() => {
    if (!currentUser.id) return;
    const q = query(collection(db, "users", currentUser.id, "nicknames"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nicks: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        nicks[doc.id] = doc.data().nickname;
      });
      setNicknames(nicks);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.id}/nicknames`);
    });
    return () => unsubscribe();
  }, [currentUser.id]);

  const lastSeenMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    lastSeenMessageIdRef.current = null;
  }, [chat?.id]);

  // Typing indicator and Seen status
  useEffect(() => {
    if (!chat?.id || !currentUser.id) return;
    
    const collectionName = isPublic ? "groups" : "chats";
    const chatRef = doc(db, collectionName, chat.id);

    const unsubscribe = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsTyping(data.typing || {});
        setIsVanishMode(!!data.vanishMode);
        setIsMuted(!!data.muted?.[currentUser.id]);
      }
    });

    // Mark as seen when opening chat or new messages arrive
    const markAsSeen = async () => {
      // Use filtered messages to ensure we only mark what the user can actually see
      const visibleMessages = displayMessages.filter(msg => !msg.deletedFor?.includes(currentUser.id));
      if (visibleMessages.length === 0) return;
      
      const lastMessage = visibleMessages[visibleMessages.length - 1];
      
      // Only mark as seen if it's a new message and not from me
      if (lastMessage.id !== lastSeenMessageIdRef.current && lastMessage.senderId !== currentUser.id) {
        // Check if we actually need to update the seen time
        let needsUpdate = true;
        if (chat?.lastRead?.[currentUser.id] && lastMessage.createdAt) {
          const lastReadTime = chat.lastRead[currentUser.id].toDate ? chat.lastRead[currentUser.id].toDate().getTime() : new Date(chat.lastRead[currentUser.id]).getTime();
          const msgTime = lastMessage.createdAt.toDate ? lastMessage.createdAt.toDate().getTime() : new Date(lastMessage.createdAt as any).getTime();
          
          // If the message is older than our last read time, we don't need to update
          if (msgTime <= lastReadTime) {
            needsUpdate = false;
          }
        }

        if (needsUpdate) {
          try {
            await updateDoc(chatRef, {
              [`lastRead.${currentUser.id}`]: serverTimestamp()
            });
          } catch (err) {
            console.error("Error marking as seen:", err);
          }
        }
        // Always update the ref so we don't keep checking
        lastSeenMessageIdRef.current = lastMessage.id;
      }
    };
    markAsSeen();

    return () => unsubscribe();
  }, [chat?.id, currentUser.id, messages]);

  const handleTyping = async (isTyping: boolean) => {
    if (!chat?.id || !currentUser.id) return;
    const collectionName = isPublic ? "groups" : "chats";
    const chatRef = doc(db, collectionName, chat.id);
    try {
      await updateDoc(chatRef, {
        [`typing.${currentUser.id}`]: isTyping
      });
    } catch (err) {
      console.error("Error updating typing status:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (!isMeTyping) {
      setIsMeTyping(true);
      handleTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsMeTyping(false);
      handleTyping(false);
    }, 3000);
  };

  const handleSetNickname = async (targetUserId: string, currentName: string) => {
    setEditingNicknameUserId(targetUserId);
    setNewNicknameValue(nicknames[targetUserId] || "");
  };

  const saveNickname = async () => {
    if (!editingNicknameUserId) return;
    try {
      const nickRef = doc(db, "users", currentUser.id, "nicknames", editingNicknameUserId);
      if (!newNicknameValue.trim()) {
        await deleteDoc(nickRef);
      } else {
        await setDoc(nickRef, { nickname: newNicknameValue.trim() }, { merge: true });
      }
      setEditingNicknameUserId(null);
    } catch (err) {
      console.error("Error setting nickname:", err);
    }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!chat?.id) return;

    try {
      const collectionName = isPublic ? "groups" : "chats";
      const msgRef = doc(db, collectionName, chat.id, "messages", messageId);
      
      const msgSnap = await getDoc(msgRef);
      if (!msgSnap.exists()) return;
      const msgData = msgSnap.data();

      // 15 minute limit
      const now = new Date();
      let diffInMinutes = 0;
      
      if (msgData.createdAt) {
        const msgDate = msgData.createdAt.toDate ? msgData.createdAt.toDate() : new Date(msgData.createdAt as any);
        if (!isNaN(msgDate.getTime())) {
          diffInMinutes = (now.getTime() - msgDate.getTime()) / (1000 * 60);
        }
      }
      
      if (diffInMinutes > 15) {
        alert("You can only edit messages within 15 minutes of sending.");
        setEditingMessage(null);
        return;
      }

      let textToSave = newText;
      // Preserve encryption state of the original message
      const wasEncrypted = msgData.text.startsWith('[SECURE]');
      
      if (wasEncrypted && encryptionKey) {
        try {
          const encrypted = await encryptMessage(newText, encryptionKey);
          textToSave = `[SECURE]${encrypted}`;
        } catch (err) {
          console.error("Encryption failed during edit:", err);
          alert("Encryption failed. Message not saved.");
          return;
        }
      } else if (wasEncrypted && !encryptionKey) {
        alert("Encryption key required to edit this secure message.");
        throw new Error("Missing encryption key");
      }

      await updateDoc(msgRef, {
        text: textToSave,
        isEdited: true,
        editedAt: serverTimestamp()
      });
      console.log("EDIT SUCCESS");
      
      setEditingMessage(null);
    } catch (err) {
      console.error("Error editing message:", err);
      alert("Failed to edit message. Please check permissions or try again.");
    }
  };

  const triggerEdit = async (msg: Message) => {
    let textToEdit = msg.text;
    if (msg.text.startsWith('[SECURE]') && encryptionKey) {
      try {
        const encryptedData = msg.text.replace('[SECURE]', '');
        textToEdit = await decryptMessage(encryptedData, encryptionKey);
      } catch (err) {
        console.error("Failed to decrypt for editing:", err);
      }
    }
    setEditingMessage({ ...msg, text: textToEdit });
  };

  const toggleMute = async () => {
    if (!chat?.id) return;
    try {
      const collectionName = isPublic ? "groups" : "chats";
      const chatRef = doc(db, collectionName, chat.id);
      await updateDoc(chatRef, {
        [`muted.${currentUser.id}`]: !isMuted
      });
      setIsMuted(!isMuted);
    } catch (err) {
      console.error("Error toggling mute:", err);
    }
  };

  const toggleVanishMode = async () => {
    if (!chat?.id) return;
    try {
      const collectionName = isPublic ? "groups" : "chats";
      const chatRef = doc(db, collectionName, chat.id);
      await updateDoc(chatRef, {
        vanishMode: !isVanishMode
      });
      setIsVanishMode(!isVanishMode);
    } catch (err) {
      console.error("Error toggling vanish mode:", err);
    }
  };

  const filteredMessages = displayMessages.filter(msg => {
    if (msg.deletedFor?.includes(currentUser.id)) return false;
    if (searchQuery) {
      return msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
             msg.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const isAdmin = (isPublic || chat?.type === 'group') && (chat?.creatorId === currentUser.id || chat?.roles?.[currentUser.id] === 'admin');
  const membersList = isPublic ? chat?.membersList : chat?.participants;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAvailableUsers(users);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    if (isGroupInfoOpen) {
      fetchUsers();
    }
  }, [isGroupInfoOpen]);

  const handleAddMember = async (userId: string) => {
    if (!isAdmin || !chat?.id) return;
    try {
      const collectionName = isPublic ? "groups" : "chats";
      const groupRef = doc(db, collectionName, chat.id);
      const user = availableUsers.find(u => u.id === userId);
      
      if (isPublic) {
        await updateDoc(groupRef, {
          membersList: arrayUnion(userId),
          members: (chat.members || 0) + 1,
          [`roles.${userId}`]: 'member'
        });
      } else {
        await updateDoc(groupRef, {
          participants: arrayUnion(userId),
          members: (chat.members || 0) + 1,
          [`roles.${userId}`]: 'member',
          [`participantDetails.${userId}`]: { name: user?.name || 'Unknown', avatar: user?.avatar || '' }
        });
      }
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!isAdmin || !chat?.id || userId === chat.creatorId) return;
    try {
      const collectionName = isPublic ? "groups" : "chats";
      const groupRef = doc(db, collectionName, chat.id);
      if (isPublic) {
        await updateDoc(groupRef, {
          membersList: arrayRemove(userId),
          members: Math.max(0, (chat.members || 1) - 1),
          [`roles.${userId}`]: deleteField()
        });
      } else {
        await updateDoc(groupRef, {
          participants: arrayRemove(userId),
          members: Math.max(0, (chat.members || 1) - 1),
          [`roles.${userId}`]: deleteField(),
          [`participantDetails.${userId}`]: deleteField()
        });
      }
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleApproveRequest = async (userId: string) => {
    if (!isAdmin || !chat?.id) return;
    try {
      const groupRef = doc(db, "groups", chat.id);
      await updateDoc(groupRef, {
        pendingRequests: arrayRemove(userId),
        membersList: arrayUnion(userId),
        members: (chat.members || 0) + 1,
        [`roles.${userId}`]: 'member'
      });
    } catch (err) {
      console.error("Error approving request:", err);
    }
  };

  const handleDeclineRequest = async (userId: string) => {
    if (!isAdmin || !chat?.id) return;
    try {
      const groupRef = doc(db, "groups", chat.id);
      await updateDoc(groupRef, {
        pendingRequests: arrayRemove(userId)
      });
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  const handleUpdatePrivacy = async (privacy: 'public' | 'private' | 'hidden') => {
    if (!isAdmin || !chat?.id || !isPublic) return;
    try {
      const groupRef = doc(db, "groups", chat.id);
      await updateDoc(groupRef, {
        privacy,
        isPublic: privacy === 'public'
      });
    } catch (err) {
      console.error("Error updating privacy:", err);
    }
  };

  const handleUpdateRole = async (userId: string, role: 'admin' | 'moderator' | 'member') => {
    if (!isAdmin || !chat?.id || userId === chat.creatorId) return;
    try {
      const collectionName = isPublic ? "groups" : "chats";
      const groupRef = doc(db, collectionName, chat.id);
      await updateDoc(groupRef, {
        [`roles.${userId}`]: role
      });
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleUpdateGroupSetting = async (field: string, value: any) => {
    if (!isAdmin || !chat?.id || !isPublic) return;
    try {
      const groupRef = doc(db, "groups", chat.id);
      await updateDoc(groupRef, {
        [field]: value
      });
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
    }
  };

  const [reportedMessages, setReportedMessages] = useState<Set<string>>(new Set());

  const handlePinMessage = async (messageId: string) => {
    if (!isAdmin || !chat?.id || !isPublic) return;
    try {
      const groupRef = doc(db, "groups", chat.id);
      const isPinned = chat.pinnedPosts?.includes(messageId);
      await updateDoc(groupRef, {
        pinnedPosts: isPinned ? arrayRemove(messageId) : arrayUnion(messageId)
      });
    } catch (err) {
      console.error("Error pinning message:", err);
    }
  };

  const handleApproveMessage = async (messageId: string) => {
    if (!isAdmin || !chat?.id || !isPublic) return;
    try {
      const msgRef = doc(db, "groups", chat.id, "messages", messageId);
      await updateDoc(msgRef, {
        status: 'sent'
      });
    } catch (err) {
      console.error("Error approving message:", err);
    }
  };

  const handleReportMessage = async (messageId: string) => {
    if (!chat?.id) return;
    try {
      const reportRef = collection(db, "reports");
      await addDoc(reportRef, {
        groupId: chat.id,
        messageId,
        reporterId: currentUser.id,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      setReportedMessages(prev => new Set(prev).add(messageId));
      console.log("Message reported to group moderators.");
    } catch (err) {
      console.error("Error reporting message:", err);
    }
  };

  const handleBanMember = async (userId: string) => {
    if (!isAdmin || !chat?.id || userId === chat.creatorId) return;
    try {
      const collectionName = isPublic ? "groups" : "chats";
      const groupRef = doc(db, collectionName, chat.id);
      if (isPublic) {
        await updateDoc(groupRef, {
          membersList: arrayRemove(userId),
          bannedUsers: arrayUnion(userId),
          members: Math.max(0, (chat.members || 1) - 1),
          [`roles.${userId}`]: deleteField()
        });
      } else {
        await updateDoc(groupRef, {
          participants: arrayRemove(userId),
          bannedUsers: arrayUnion(userId),
          members: Math.max(0, (chat.members || 1) - 1),
          [`roles.${userId}`]: deleteField(),
          [`participantDetails.${userId}`]: deleteField()
        });
      }
    } catch (err) {
      console.error("Error banning member:", err);
    }
  };

  let displayName = chat?.name || '';
  let displayAvatar = chat?.avatar || '';
  let otherParticipantId = '';
  
  if (!isPublic && chat?.type === 'dm' && chat?.participants && chat?.participantDetails) {
    otherParticipantId = chat.participants.find((id: string) => id !== currentUser.id) || '';
    if (otherParticipantId && chat.participantDetails[otherParticipantId]) {
      displayName = nicknames[otherParticipantId] || chat.participantDetails[otherParticipantId].name;
      displayAvatar = chat.participantDetails[otherParticipantId].avatar;
    }
  }

  useEffect(() => {
    const checkBuddyHealth = async () => {
      try {
        const response = await fetch('/api/nlp/health');
        const data = await response.json();
        setBuddyStatus(data.status === 'online' ? 'online' : 'offline');
      } catch (err) {
        setBuddyStatus('offline');
      }
    };
    
    if (isBuddyOpen) {
      checkBuddyHealth();
      const interval = setInterval(checkBuddyHealth, 10000);
      return () => clearInterval(interval);
    }
  }, [isBuddyOpen]);

  const handleBack = async () => {
    if (isVanishMode && chat?.id) {
      // Mark all currently visible messages as deleted for this user
      const visibleMessages = displayMessages.filter(msg => !msg.deletedFor?.includes(currentUser.id));
      for (const msg of visibleMessages) {
        const msgRef = doc(db, isPublic ? "groups" : "chats", chat.id, "messages", msg.id);
        try {
          await updateDoc(msgRef, {
            deletedFor: arrayUnion(currentUser.id)
          });
        } catch (err) {
          console.error("Error cleaning up vanish mode message:", err);
        }
      }
    }
    onBack();
  };

  const uploadFileToStorage = async (file: File | Blob, fileName?: string): Promise<{ url: string, name: string, type: string, size: number }> => {
    console.log("Starting upload for:", fileName || (file as File).name);
    const name = fileName || (file as File).name || `file-${Date.now()}`;
    const storageRef = ref(storage, `chats/${chat.id}/${Date.now()}-${name}`);
    console.log("Storage ref created:", storageRef.fullPath);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        }, 
        (error) => {
          console.error("Upload failed:", error);
          reject(error);
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((url) => {
            console.log("URL obtained:", url);
            resolve({
              url,
              name,
              type: file.type,
              size: file.size
            });
          });
        }
      );
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setPendingFiles(fileArray);
    setIsModalOpen(true);
    e.target.value = '';
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const mediaFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (mediaFiles.length === 0) {
      alert("Please select only photos or videos.");
      return;
    }
    
    setPendingFiles(mediaFiles);
    setIsModalOpen(true);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    if (audioFiles.length === 0) {
      alert("Please select only audio files.");
      return;
    }
    
    setPendingFiles(audioFiles);
    setIsModalOpen(true);
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingPaused(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isRecordingPaused) {
      mediaRecorderRef.current.pause();
      setIsRecordingPaused(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isRecordingPaused) {
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordedBlob(null);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendAudioMessage = async () => {
    if (!recordedBlob) return;
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(recordedBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await onSendMessage('', undefined, undefined, {
          type: 'audio',
          audioUrl: base64data,
          audioDuration: recordingDuration
        });
        setRecordedBlob(null);
        setRecordingDuration(0);
        setIsUploading(false);
      };
    } catch (err) {
      console.error("Error sending audio:", err);
      setIsUploading(false);
    }
  };

  const sendFiles = async (files: File[], captions: string[]) => {
    setIsModalOpen(false);
    
    const mediaFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    const otherFiles = files.filter(f => !f.type.startsWith('image/') && !f.type.startsWith('video/'));

    // Handle media group
    if (mediaFiles.length > 1) {
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        avatar: currentUser.avatar,
        text: captions[0] || "Shared media",
        timestamp: new Date().toISOString(),
        timezone: currentUser.timezone,
        location: currentUser.location,
        localTime: new Date().toLocaleTimeString(),
        type: 'mediaGroup',
        mediaUrls: mediaFiles.map(f => URL.createObjectURL(f)),
        mediaTypes: mediaFiles.map(f => f.type.startsWith('video/') ? 'video' : 'image'),
        caption: captions[0],
        status: 'sending'
      };
      setPendingMessages(prev => [...prev, tempMsg]);
      
      (async () => {
        const mediaUrls: string[] = [];
        const mediaTypes: string[] = [];
        for (const file of mediaFiles) {
          try {
            const data = await uploadFileToStorage(file);
            mediaUrls.push(data.url);
            mediaTypes.push(data.type.startsWith('video/') ? 'video' : 'image');
          } catch (err) { console.error("Media upload error:", err); }
        }
        
        if (mediaUrls.length > 0) {
          await onSendMessage(captions[0] || "Shared media", undefined, undefined, {
            type: 'mediaGroup',
            mediaUrls,
            mediaTypes,
            caption: captions[0]
          });
          setPendingMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        }
      })();
    } else if (mediaFiles.length === 1) {
      // Single media
      const file = mediaFiles[0];
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        avatar: currentUser.avatar,
        text: captions[0] || "Shared media",
        timestamp: new Date().toISOString(),
        timezone: currentUser.timezone,
        location: currentUser.location,
        localTime: new Date().toLocaleTimeString(),
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        caption: captions[0],
        status: 'sending'
      };
      setPendingMessages(prev => [...prev, tempMsg]);
      
      (async () => {
        try {
          const data = await uploadFileToStorage(file);
          await onSendMessage(captions[0] || "Shared media", {
            url: data.url,
            name: data.name,
            type: data.type,
            size: data.size
          }, undefined, { caption: captions[0] });
          setPendingMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        } catch (err) { console.error("Media upload error:", err); }
      })();
    }

    // Handle other files
    for (const file of otherFiles) {
      const idx = files.indexOf(file);
      const caption = captions[idx];
      const tempMsg: Message = {
        id: `temp-${Date.now()}-${idx}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        avatar: currentUser.avatar,
        text: caption || "Shared a file",
        timestamp: new Date().toISOString(),
        timezone: currentUser.timezone,
        location: currentUser.location,
        localTime: new Date().toLocaleTimeString(),
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: 'sending'
      };
      setPendingMessages(prev => [...prev, tempMsg]);
      
      (async () => {
        try {
          const data = await uploadFileToStorage(file);
          await onSendMessage(caption || "Shared a file", {
            url: data.url,
            name: data.name,
            type: data.type,
            size: data.size
          }, undefined, { caption });
          setPendingMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        } catch (err) { console.error("File upload error:", err); }
      })();
    }
    
    setPendingFiles([]);
  };

  const handleSendPoll = (question: string, options: string[]) => {
    const pollOptions = options.map(opt => ({ text: opt, votes: [] }));
    onSendMessage("Shared a poll", undefined, undefined, {
      type: 'poll',
      question,
      options: pollOptions
    });
  };

  const handleSendEvent = (title: string, date: string, location: string) => {
    onSendMessage(`Event: ${title}`, undefined, undefined, {
      type: 'event',
      eventTitle: title,
      eventDate: date,
      eventLocation: location,
      eventRSVPs: {}
    });
  };

  const handleSendContacts = (contacts: User[]) => {
    contacts.forEach(contact => {
      onSendMessage(`Contact: ${contact.name}`, undefined, undefined, {
        type: 'contact',
        contact: {
          name: contact.name,
          avatar: contact.avatar,
          id: contact.id
        }
      });
    });
  };

  const handleSendAudio = async (blob: Blob, duration: number) => {
    setIsUploading(true);
    try {
      const data = await uploadFileToStorage(blob, `voice-note-${Date.now()}.webm`);
      onSendMessage("Voice Note", {
        url: data.url,
        name: "Voice Note",
        type: "audio/webm",
        size: blob.size
      }, undefined, {
        type: 'audio',
        audioUrl: data.url,
        audioDuration: duration
      });
    } catch (err) {
      console.error("Error uploading audio:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendCameraCapture = async (blob: Blob) => {
    const photoFile = new (window as any).File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setPendingFiles([photoFile]);
    setIsModalOpen(true);
  };

  const handleSendSticker = (stickerUrl: string) => {
    onSendMessage("Shared a sticker", undefined, undefined, {
      type: 'sticker',
      stickerUrl
    });
  };

  const handleForwardMessage = (chatIds: string[], message: Message) => {
    chatIds.forEach(async (chatId) => {
      const collectionName = chatId.startsWith('group_') ? "groups" : "chats"; // This is a heuristic, might need better logic
      // For now, I'll just use onSendMessage if it's the current chat, 
      // but for other chats I need to add to Firestore directly.
      // Since Dashboard handles the sending, I might need to pass a "forward" function or handle it here.
      
      const msgData = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        avatar: currentUser.avatar,
        text: message.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timezone: currentUser.timezone,
        location: currentUser.location,
        localTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp(),
        status: 'sent',
        type: message.type || 'text',
        ...(message.fileUrl && { fileUrl: message.fileUrl, fileName: message.fileName, fileType: message.fileType, fileSize: message.fileSize }),
        ...(message.question && { question: message.question, options: message.options }),
        ...(message.eventTitle && { eventTitle: message.eventTitle, eventDate: message.eventDate, eventLocation: message.eventLocation }),
        ...(message.contact && { contact: message.contact }),
        ...(message.audioUrl && { audioUrl: message.audioUrl, audioDuration: message.audioDuration }),
        ...(message.stickerUrl && { stickerUrl: message.stickerUrl }),
        isForwarded: true
      };

      try {
        // We need to know if the chatId is a group or a private chat.
        // I'll check the available chats.
        await addDoc(collection(db, "chats", chatId, "messages"), msgData).catch(() => 
          addDoc(collection(db, "groups", chatId, "messages"), msgData)
        );
      } catch (err) {
        console.error("Error forwarding message:", err);
      }
    });
  };

  const askBuddy = async (customMessage?: string) => {
    const textToProcess = customMessage || "Please analyze the recent chat context and provide insights.";
    
    if (customMessage) {
      setBuddyMessages(prev => [...prev, { role: 'user', text: customMessage }]);
    }
    
    setIsAiLoading(true);
    try {
      const context = displayMessages.slice(-10).map(m => `${m.senderName}: ${m.text}`).join('\n');
      
      // Try Python NLP first
      const response = await fetch("/api/nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          command: "chat", 
          text: textToProcess, 
          context,
          chat_history_ids: chatHistoryIds
        })
      });
      
      if (!response.ok) throw new Error("Python NLP service failed");
      
      const data = await response.json();
      
      if (data.chat_history_ids) {
        setChatHistoryIds(data.chat_history_ids);
      }
      
      const aiReply = data.result || "I'm here to help you understand the chat!";
      setBuddyMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
      
      // Also send to main chat if it was a general "help me understand" request
      if (!customMessage && onSendAIMessage) {
        onSendAIMessage(aiReply);
      }
    } catch (err) {
      console.warn("Python NLP failed, falling back to Gemini:", err);
      
      // Fallback to Gemini
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const context = displayMessages.slice(-10).map(m => `${m.senderName}: ${m.text}`).join('\n');
        
        const prompt = `You are the "Python NLP Buddy" assistant in a study platform. 
        The primary Python neural network (DialoGPT) is currently offline, so you are filling in.
        
        Recent chat context:
        ${context}
        
        User message: ${textToProcess}
        
        Provide a helpful, expert response.`;
        
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt
        });
        
        const aiReply = result.text || "I'm sorry, I'm having trouble connecting to my neural networks right now.";
        setBuddyMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
        
        if (!customMessage && onSendAIMessage) {
          onSendAIMessage(aiReply);
        }
      } catch (geminiError) {
        console.error("Gemini fallback failed:", geminiError);
        setBuddyMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, both my primary and secondary neural networks are currently offline. Please try again later." }]);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (buddyScrollRef.current) {
      buddyScrollRef.current.scrollTop = buddyScrollRef.current.scrollHeight;
    }
  }, [buddyMessages]);

  const prevMessagesCount = useRef(displayMessages.length);

  useEffect(() => {
    if (scrollContainerRef.current && displayMessages.length > prevMessagesCount.current) {
      const isAtBottom = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.scrollTop <= scrollContainerRef.current.clientHeight + 100;
      
      if (isAtBottom || displayMessages[displayMessages.length - 1]?.senderId === currentUser.id) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
    prevMessagesCount.current = displayMessages.length;
  }, [displayMessages, chat?.id, currentUser.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isAiLoading) return;
    
    // Check for link restrictions
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hasLink = urlRegex.test(newMessage);
    const allowedMedia = chat?.allowedMedia || ['images', 'videos', 'files', 'links'];
    if (isPublic && hasLink && !allowedMedia.includes('links')) {
      alert("This group does not allow sharing links.");
      return;
    }

    let text = newMessage;
    setNewMessage('');

    // E2E Encryption
    if (isSecureMode && encryptionKey) {
      try {
        text = await encryptMessage(text, encryptionKey);
        // Add a prefix so we know it's encrypted
        text = `[SECURE]${text}`;
      } catch (err) {
        console.error("Encryption failed:", err);
        alert("Encryption failed. Message not sent.");
        return;
      }
    }
    
    onSendMessage(text, undefined, replyToMessage ? { 
      id: replyToMessage.id, 
      text: replyToMessage.text,
      senderName: replyToMessage.senderName,
      senderId: replyToMessage.senderId
    } : undefined);

    const isNLPCommand = text.toLowerCase().startsWith('/summarize') || 
                         text.toLowerCase().startsWith('/sentiment') || 
                         text.toLowerCase().startsWith('/keywords') || 
                         text.toLowerCase().startsWith('/grammar');

    if (isNLPCommand) {
      const parts = text.split(' ');
      const command = parts[0].substring(1).toLowerCase() as 'summarize' | 'sentiment' | 'keywords' | 'grammar';
      const prompt = parts.slice(1).join(' ').trim();
      
      if (prompt) {
        setIsAiLoading(true);
        try {
          const aiResponse = await performNLPTask(command, prompt);
          if (onSendAIMessage) {
            onSendAIMessage(`[NLP ${command.toUpperCase()}] ${aiResponse}`);
          }
        } catch (err) {
          console.error(err);
          if (onSendAIMessage) {
            onSendAIMessage("Sorry, I encountered an error while processing your NLP request.");
          }
        } finally {
          setIsAiLoading(false);
        }
      }
    } else if (text.toLowerCase().startsWith('@ai ')) {
      const prompt = text.slice(4).trim();
      if (prompt) {
        setIsAiLoading(true);
        try {
          // Pass context of the chat
          const context = displayMessages.slice(-5).map(m => `${m.senderName}: ${m.text}`).join('\n');
          const fullPrompt = `Context of conversation:\n${context}\n\nUser asked: ${prompt}\n\nProvide a helpful response.`;
          
          const aiResponse = await askGemini(fullPrompt, 'flash');
          
          if (onSendAIMessage) {
            onSendAIMessage(aiResponse);
          }
        } catch (err) {
          console.error(err);
          if (onSendAIMessage) {
            onSendAIMessage("Sorry, I encountered an error while processing your request.");
          }
        } finally {
          setIsAiLoading(false);
        }
      }
    } else if (text.toLowerCase().startsWith('@python ')) {
      const prompt = text.slice(8).trim();
      if (prompt) {
        setIsAiLoading(true);
        try {
          const response = await fetch("/api/nlp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              command: "chat", 
              text: prompt, 
              chat_history_ids: chatHistoryIds 
            })
          });
          const data = await response.json();
          if (data.chat_history_ids) {
            setChatHistoryIds(data.chat_history_ids);
          }
          if (onSendAIMessage) {
            onSendAIMessage(`[Python Expert] ${data.result}`);
          }
        } catch (err) {
          console.error(err);
          if (onSendAIMessage) {
            onSendAIMessage("Sorry, I couldn't connect to the Python Expert AI.");
          }
        } finally {
          setIsAiLoading(false);
        }
      }
    }
  };

  const handleTranslate = React.useCallback(async (msgId: string, text: string) => {
    if (isTranslating === msgId || !text) return;
    
    const effectiveLang = localLanguage || globalLanguage;
    if (!effectiveLang) return;

    setIsTranslating(msgId);
    try {
      const translated = await translateText(text, effectiveLang);
      setTranslatedMessages(prev => ({ ...prev, [msgId]: translated }));
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setIsTranslating(null);
    }
  }, [localLanguage, globalLanguage, isTranslating]);


  const handleThemeSelect = async (themeIndex: number) => {
    if (!chat?.id) return;
    const themes = [
      { name: 'Default', bg: 'bg-bg', bubble: 'from-primary to-primary/80' },
      { name: 'Ocean', bg: 'bg-blue-950', bubble: 'from-blue-500 to-cyan-400' },
      { name: 'Sunset', bg: 'bg-orange-950', bubble: 'from-orange-500 to-pink-500' },
      { name: 'Forest', bg: 'bg-emerald-950', bubble: 'from-emerald-500 to-teal-400' },
      { name: 'Galaxy', bg: 'bg-indigo-950', bubble: 'from-indigo-600 to-purple-600' },
      { name: 'Lava', bg: 'bg-red-950', bubble: 'from-red-600 to-orange-600' },
      { name: 'Cyberpunk', bg: 'bg-pink-950', bubble: 'from-pink-500 to-purple-500' },
      { name: 'Midnight', bg: 'bg-slate-950', bubble: 'from-slate-700 to-slate-900' },
      { name: 'Minimal', bg: 'bg-white', bubble: 'from-gray-200 to-gray-300', text: 'text-black' },
    ];
    
    const selected = themes[themeIndex];
    try {
      const collectionName = isPublic ? "groups" : "chats";
      const chatRef = doc(db, collectionName, chat.id);
      await updateDoc(chatRef, { 
        theme: selected.bg,
        bubbleTheme: selected.bubble,
        themeName: selected.name
      });
      setIsThemesOpen(false);
    } catch (err) {
      console.error("Error updating theme:", err);
    }
  };

  const handleAddHiddenWord = () => {
    if (newHiddenWord.trim()) {
      setHiddenWords(prev => [...prev, newHiddenWord.trim().toLowerCase()]);
      setNewHiddenWord('');
    }
  };

  const handleRemoveHiddenWord = (word: string) => {
    setHiddenWords(prev => prev.filter(w => w !== word));
  };

  if (!chat) return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center text-muted h-full">
      <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
      <p>Select a {isPublic ? 'study group' : 'conversation'} to start interacting</p>
    </div>
  );

  return (
    <div 
      className={`flex-1 flex flex-col min-h-0 w-full ${chat.theme || 'bg-bg'} relative`}
      style={{ backgroundImage: chat.backgroundImage ? `url(${chat.backgroundImage})` : undefined, backgroundSize: 'cover' }}
    >
      {/* Global Backdrop for Header Menu */}
      {isHeaderMenuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200" 
          onClick={() => setIsHeaderMenuOpen(false)}
        />
      )}
      {/* Chat Header */}
      <div 
        className="h-16 md:h-20 border-b border-border px-3 md:px-6 flex items-center justify-between bg-surface/50 backdrop-blur-md shrink-0 relative z-[70]"
        style={chat.theme ? { backgroundColor: chat.theme } : {}}
      >
        {isSearchOpen ? (
          <div className="absolute inset-0 bg-surface flex items-center px-4 z-50 animate-in slide-in-from-top duration-200">
            <Search className="w-5 h-5 text-muted mr-3" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in conversation..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text placeholder:text-muted"
            />
            <button 
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="p-2 text-muted hover:text-text"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <button className="md:hidden p-2 -ml-2 text-muted hover:text-text shrink-0" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              {isPublic ? (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                  <Hash className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
              ) : (
                <div className="relative shrink-0">
                  <img src={displayAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`} alt={displayName} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover bg-surface" referrerPolicy="no-referrer" />
                  {chat.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 border-2 border-surface rounded-full" />}
                </div>
              )}
              <div className="min-w-0 pr-2">
                <h3 className="font-bold text-sm md:text-lg truncate text-text">{displayName}</h3>
                {isPublic ? (
                  <p className="text-[10px] md:text-xs text-muted truncate">{chat.members} members • {chat.topic}</p>
                ) : (
                  chat.type === 'dm' ? (
                    <div className="text-[10px] md:text-xs text-muted flex items-center gap-1 truncate">
                      {chat.lastRead?.[otherParticipantId] ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active {(() => {
                            try {
                              const time = chat.lastRead[otherParticipantId];
                              const date = time.toDate ? time.toDate() : new Date(time);
                              return formatRelativeTime(date);
                            } catch (e) {
                              return '';
                            }
                          })()}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 shrink-0" /> <span className="truncate">{chat.localTime} {chat.timezone} • {chat.location}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] md:text-xs text-muted truncate">{chat.members} members</p>
                  )
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-3 shrink-0">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-all"
                title="Search Messages"
              >
                <Search className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className={`p-2 rounded-xl transition-all ${isHeaderMenuOpen ? 'text-primary bg-primary/10' : 'text-muted hover:text-text hover:bg-surface'}`}
                  title="Chat Info & Settings"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {isHeaderMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-2xl shadow-2xl z-[80] overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-4 border-b border-border flex flex-col items-center text-center">
                        <img src={displayAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`} alt={displayName} className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-primary/20" referrerPolicy="no-referrer" />
                        <h4 className="font-bold text-text">{displayName}</h4>
                        <p className="text-xs text-muted">@{displayName.toLowerCase().replace(/\s/g, '')}</p>
                      </div>
                      
                      <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-3 gap-2 p-2 mb-2">
                          <button onClick={toggleMute} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-bg transition-colors">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500/10 text-red-500' : 'bg-surface border border-border text-text'}`}>
                              {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                            </div>
                            <span className="text-[10px] font-medium text-muted">{isMuted ? 'Unmute' : 'Mute'}</span>
                          </button>
                          <button onClick={toggleVanishMode} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-bg transition-colors">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isVanishMode ? 'bg-purple-500/10 text-purple-500' : 'bg-surface border border-border text-text'}`}>
                              <Ghost className={`w-5 h-5 ${isVanishMode ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className="text-[10px] font-medium text-muted">Vanish</span>
                          </button>
                          <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-bg transition-colors">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-border text-text">
                              <Search className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-medium text-muted">Search</span>
                          </button>
                        </div>

                        <div className="h-px bg-border mx-2 my-1" />

                        <button 
                          onClick={() => { setIsThemesOpen(true); setIsHeaderMenuOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-bg rounded-xl text-sm text-text transition-colors group"
                        >
                          <Palette className="w-4 h-4 text-purple-400" />
                          <span className="flex-1 text-left">Theme</span>
                          <ChevronRight className="w-4 h-4 text-muted group-hover:text-text" />
                        </button>

                        <button 
                          onClick={() => { setIsChatControlsOpen(true); setIsHeaderMenuOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-bg rounded-xl text-sm text-text transition-colors group"
                        >
                          <SettingsIcon className="w-4 h-4 text-blue-400" />
                          <span className="flex-1 text-left">Chat Controls</span>
                          <ChevronRight className="w-4 h-4 text-muted group-hover:text-text" />
                        </button>

                        <button 
                          onClick={() => { setIsPrivacySafetyOpen(true); setIsHeaderMenuOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-bg rounded-xl text-sm text-text transition-colors group"
                        >
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span className="flex-1 text-left">Privacy & Safety</span>
                          <ChevronRight className="w-4 h-4 text-muted group-hover:text-text" />
                        </button>

                        {!isPublic && chat?.type === 'dm' && otherParticipantId && (
                          <button 
                            onClick={() => { handleSetNickname(otherParticipantId, displayName); setIsHeaderMenuOpen(false); }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-bg rounded-xl text-sm text-text transition-colors group"
                          >
                            <UserIcon className="w-4 h-4 text-amber-400" />
                            <span className="flex-1 text-left">Nicknames</span>
                            <ChevronRight className="w-4 h-4 text-muted group-hover:text-text" />
                          </button>
                        )}

                        <button 
                          onClick={() => { setIsToolsOpen(true); setIsHeaderMenuOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-bg rounded-xl text-sm text-text transition-colors group"
                        >
                          <Layout className="w-4 h-4 text-primary" />
                          <span className="flex-1 text-left">Study Tools</span>
                          <ChevronRight className="w-4 h-4 text-muted group-hover:text-text" />
                        </button>

                      {(isPublic || chat?.type === 'group') && (
                        <button 
                          onClick={() => { setIsGroupInfoOpen(true); setIsHeaderMenuOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-bg rounded-xl text-sm text-text transition-colors group"
                        >
                          <Users className="w-4 h-4 text-indigo-400" />
                          <span className="flex-1 text-left">Group Information</span>
                          <ChevronRight className="w-4 h-4 text-muted group-hover:text-text" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="hidden lg:flex items-center gap-2 mr-2 px-3 py-1.5 bg-surface/50 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsSecureMode(!isSecureMode)}
                    className={`p-1.5 rounded-lg transition-colors ${isSecureMode ? 'text-emerald-400 bg-emerald-500/10' : 'text-muted hover:text-text'}`}
                    title={isSecureMode ? "Secure Mode On" : "Secure Mode Off"}
                  >
                    {isSecureMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  {isSecureMode && (
                    <input 
                      type="password"
                      value={encryptionKey}
                      onChange={(e) => setEncryptionKey(e.target.value)}
                      placeholder="Key..."
                      className="w-20 bg-transparent border-none text-xs focus:ring-0 p-0 placeholder:text-muted/50 text-text"
                    />
                  )}
                </div>
                <div className="w-px h-6 bg-border mx-1" />
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted uppercase font-bold tracking-wider">Global</span>
                    <select 
                      value={globalLanguage || ''} 
                      onChange={(e) => setGlobalLanguage(e.target.value || null)}
                      className="bg-transparent border-none text-[10px] focus:ring-0 p-0 text-muted cursor-pointer max-w-[80px] appearance-none"
                    >
                      <option value="">Off</option>
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-primary uppercase font-bold tracking-wider">This Chat</span>
                    <select 
                      value={localLanguage || ''} 
                      onChange={(e) => setLocalLanguage(e.target.value || null)}
                      className="bg-transparent border-none text-[10px] focus:ring-0 p-0 text-primary cursor-pointer max-w-[80px] appearance-none"
                    >
                      <option value="">Default</option>
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {appCustomization.enableAiBuddy && (
                <button onClick={() => setIsBuddyOpen(!isBuddyOpen)} className={`p-2 rounded-xl transition-colors ${isBuddyOpen ? 'bg-primary text-white' : 'text-muted hover:text-text hover:bg-surface'}`} title="Toggle AI Buddy"><Bot className="w-5 h-5" /></button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {displayMessages.filter(msg => !msg.deletedFor?.includes(currentUser.id)).map((msg, index, filteredArray) => {
            const isMe = msg.senderId === currentUser.id;
            const isAi = msg.senderId === 'ai-assistant';
            const eCount = getEmojiCount(msg.text.startsWith('[SECURE]') ? '' : msg.text); // Simplified check, DecryptedMessage handles it better but we need it here for bubble styling
            const isPlainEmoji = eCount > 0 && eCount <= 2;
            
            let isSeenByAny = false;
            if (isMe && chat?.lastRead && msg.createdAt) {
              try {
                const msgDate = msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt as any);
                isSeenByAny = Object.entries(chat.lastRead).some(([uid, time]) => {
                  if (uid === currentUser.id || !time) return false;
                  const readDate = (time as any).toDate ? (time as any).toDate() : new Date(time as any);
                  return readDate.getTime() >= msgDate.getTime() - 1000;
                });
              } catch (e) {}
            }

            let isEditable = false;
            if (msg.createdAt) {
              try {
                const msgDate = msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt as any);
                if (!isNaN(msgDate.getTime())) {
                  const diffInMinutes = (new Date().getTime() - msgDate.getTime()) / (1000 * 60);
                  isEditable = diffInMinutes <= 15;
                }
              } catch (e) {
                console.warn("Could not verify message age for editing:", e);
              }
            }

            return (
              <motion.div 
                key={msg.stableKey || msg.id} 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ 
                  duration: 0.2,
                  ease: "easeOut"
                }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                
                <div className={`flex gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 mt-1 flex items-center justify-center overflow-hidden ${isAi ? 'bg-primary/20 text-primary' : ''}`}>
                      {isAi ? <Sparkles className="w-5 h-5" /> : <img src={msg.avatar} alt={nicknames[msg.senderId] || msg.senderName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                    </div>
                  )}
                  <div className={`${(msg.fileUrl && (isImage(msg.fileType, msg.fileUrl, msg.fileName) || isVideo(msg.fileType, msg.fileUrl, msg.fileName))) || msg.type === 'mediaGroup' ? 'p-1' : (isPlainEmoji ? 'p-0' : 'p-3 md:p-4')} rounded-2xl ${isPlainEmoji ? 'bg-transparent shadow-none border-none' : (isMe ? `bg-gradient-to-br ${chat.bubbleTheme || 'from-primary to-primary/80'} text-white rounded-tr-none shadow-lg shadow-primary/10` : isAi ? 'bg-surface/80 text-text border border-primary/30 rounded-tl-sm' : 'bg-surface text-text rounded-tl-sm border border-border/50')} relative peer group transition-all duration-200 hover:shadow-xl`}>
                    <MessageContent 
                      msg={msg} 
                      currentUser={currentUser}
                      isPublic={isPublic}
                      chat={chat}
                      encryptionKey={encryptionKey}
                      isSecureMode={isSecureMode}
                      localLanguage={localLanguage}
                      globalLanguage={globalLanguage}
                      nicknames={nicknames}
                      translatedMessages={translatedMessages}
                      isTranslating={isTranslating}
                      handleTranslate={handleTranslate}
                      triggerEdit={triggerEdit}
                      setReplyToMessage={setReplyToMessage}
                      handleReportMessage={handleReportMessage}
                      handleSetNickname={handleSetNickname}
                      isAdmin={isAdmin}
                      handlePinMessage={handlePinMessage}
                      handleForwardMessage={(msg) => setForwardingMessage(msg)}
                      actionsOpenMsgId={actionsOpenMsgId}
                      setActionsOpenMsgId={setActionsOpenMsgId}
                      isAttachmentMenuOpen={showAttachmentMenu}
                      setLightboxUrl={setLightboxUrl}
                    />
                    {msg.status === 'pending' && isAdmin && !isMe && (
                      <div className="flex items-center gap-2 mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-in fade-in slide-in-from-top-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tight">Awaiting Approval</span>
                        <button 
                          onClick={() => handleApproveMessage(msg.id)}
                          className="ml-auto text-[10px] bg-amber-500 text-white px-3 py-1 rounded-lg font-bold hover:opacity-90 transition-all shadow-sm"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                    <div className={`text-[10px] mt-2 ${isMe ? 'text-white/70 text-right flex items-center justify-end gap-1.5' : isAi ? 'text-primary' : 'text-muted'}`}>
                      {msg.createdAt ? (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt as any)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : msg.timestamp} {msg.isEdited && <span className="opacity-60 ml-1">(edited)</span>}
                      {isMe && !isAi && (
                        <span className="ml-1">
                          {msg.status === 'pending' ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCheck className={`w-3 h-3 ${isSeenByAny ? 'text-blue-400' : 'text-white/50'}`} />
                          )}
                        </span>
                      )}
                    </div>
                    
                    {/* Reactions Pill */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} bg-surface border border-border rounded-full px-2 py-1 flex items-center gap-1 shadow-md text-[10px] z-10 whitespace-nowrap text-text`}>
                        {Array.from(new Set(Object.values(msg.reactions))).slice(0, 3).map((emoji, idx) => (
                          <span key={idx} className="scale-110">{emoji}</span>
                        ))}
                        {Object.keys(msg.reactions).length > 1 && (
                          <span className="text-muted ml-0.5 font-bold">{Object.keys(msg.reactions).length}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Action Buttons - Constantly Visible */}
                  {!showAttachmentMenu && (
                    <div className={`flex flex-col gap-1 self-center ${isMe ? 'mr-2' : 'ml-2'}`}>
                      <div 
                        className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors relative cursor-pointer"
                        title="React"
                        onClick={() => setReactingToMsgId(msg.id)}
                      >
                        <Smile className="w-4 h-4" />
                        {reactingToMsgId === msg.id && (
                          <div className="absolute z-50 bottom-full mb-2 right-0">
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]" onClick={(e) => { e.stopPropagation(); setReactingToMsgId(null); }}>
                              <div className="relative bg-surface rounded-2xl shadow-2xl border border-border p-2" onClick={e => e.stopPropagation()}>
                                <div 
                                  onClick={(e) => { e.stopPropagation(); setReactingToMsgId(null); }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-[110] cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </div>
                                <EmojiPicker 
                                  onEmojiClick={async (emoji) => {
                                    const msgRef = doc(db, isPublic ? "groups" : "chats", chat.id, "messages", msg.id);
                                    await updateDoc(msgRef, { [`reactions.${currentUser.id}`]: emoji.emoji });
                                    setReactingToMsgId(null);
                                  }}
                                  theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                                  width={300}
                                  height={400}
                                  skinTonesDisabled
                                  searchDisabled
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => setReplyToMessage(msg)}
                        className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
                        title="Reply"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Seen Status - Receipts shown under the specific message last read by each user */}
                {isMe && chat?.lastRead && (
                  (() => {
                    try {
                      if (!msg.createdAt) return null;
                      const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt as any);
                      
                      const seenByUsers = Object.entries(chat.lastRead).filter(([uid, time]) => {
                        if (uid === currentUser.id || !time) return false;
                        const readDate = (time as any).toDate ? (time as any).toDate() : new Date(time as any);
                        
                        // Is this message seen by this user? (1s buffer for server timestamp sync)
                        const isSeen = readDate.getTime() >= msgDate.getTime() - 1000;
                        if (!isSeen) return false;
                        
                        // Is this the LATEST message seen by this user in the current view?
                        const isLatestSeen = !filteredArray.slice(index + 1).some(nextMsg => {
                          if (!nextMsg.createdAt) return false;
                          const nextMsgDate = nextMsg.createdAt?.toDate ? nextMsg.createdAt.toDate() : new Date(nextMsg.createdAt as any);
                          return readDate.getTime() >= nextMsgDate.getTime() - 1000;
                        });
                        
                        return isLatestSeen;
                      });

                      if (seenByUsers.length === 0) return null;

                      const sorted = seenByUsers.sort((a, b) => {
                        const dateA = (a[1] as any).toDate ? (a[1] as any).toDate() : new Date(a[1] as any);
                        const dateB = (b[1] as any).toDate ? (b[1] as any).toDate() : new Date(b[1] as any);
                        return dateB.getTime() - dateA.getTime();
                      });

                      const mostRecent = sorted[0];
                      const date = (mostRecent[1] as any).toDate ? (mostRecent[1] as any).toDate() : new Date(mostRecent[1] as any);
                      const relativeTime = formatRelativeTime(date);

                      return (
                        <div className="text-[10px] text-muted mt-1 mr-2 text-right animate-in fade-in slide-in-from-top-1">
                          {chat.type === 'dm' ? (
                            `Seen ${relativeTime}`
                          ) : (
                            sorted.length === 1 ? (
                              `Seen by ${chat.participantDetails?.[mostRecent[0]]?.name || 'Someone'} ${relativeTime}`
                            ) : (
                              `Seen by ${sorted.length} members • ${relativeTime}`
                            )
                          )}
                        </div>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {isVanishMode && (
          <div className="text-center py-4">
            <p className="text-[10px] text-purple-400 uppercase font-bold tracking-widest animate-pulse">Vanish Mode Active</p>
            <p className="text-[8px] text-muted mt-1">Messages disappear when you close the chat</p>
          </div>
        )}
        {isAiLoading && (
          <div className="flex flex-col items-start">
            <div className="flex flex-wrap items-center gap-2 mb-1 ml-12 md:ml-14">
              <span className="text-xs font-bold text-primary flex items-center gap-1"><Sparkles className="w-3 h-3 animate-pulse" /> Gemini AI</span>
            </div>
            <div className="flex gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] flex-row">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 mt-1 flex items-center justify-center overflow-hidden bg-primary/20 text-primary">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="p-3 md:p-4 rounded-2xl bg-surface/80 text-text border border-primary/30 rounded-tl-sm">
                <p className="text-sm leading-relaxed break-words">Thinking...</p>
              </div>
            </div>
          </div>
        )}
        {/* Typing Indicator */}
        {Object.entries(isTyping).some(([uid, typing]) => uid !== currentUser.id && typing) && (
          <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2">
            <div className="flex gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] flex-row items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden bg-surface border border-border">
                <UserIcon className="w-4 h-4 text-muted" />
              </div>
              <div className="p-3 md:p-4 rounded-2xl bg-surface text-text rounded-tl-sm border border-border/50 flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-surface/80 border-t border-border backdrop-blur-md shrink-0 relative z-50">
        {replyToMessage && (
          <div className="flex items-center justify-between p-2 mb-2 bg-bg rounded-lg text-xs text-muted border border-border">
            <span className="truncate">
              Replying to {replyToMessage.senderId === currentUser.id ? 'yourself' : (nicknames[replyToMessage.senderId] || replyToMessage.senderName)}: {replyToMessage.text}
            </span>
            <button onClick={() => setReplyToMessage(null)} className="ml-2 hover:text-text">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            multiple
          />
          <input 
            type="file" 
            ref={mediaInputRef} 
            onChange={handleMediaChange} 
            className="hidden" 
            accept="image/*,video/*"
            multiple
          />
          <input 
            type="file" 
            ref={audioInputRef} 
            onChange={handleAudioFileChange} 
            className="hidden" 
            accept="audio/*"
            multiple
          />
          <div className="relative shrink-0">
            <button 
              type="button" 
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              disabled={isUploading || isRecording}
              className="p-2 md:p-3 text-muted hover:text-text hover:bg-bg rounded-xl transition-colors disabled:opacity-50"
              title="Attachments"
            >
              <Plus className="w-5 h-5" />
            </button>
            {showAttachmentMenu && (
              <AttachmentMenu 
                onClose={() => setShowAttachmentMenu(false)}
                onSelect={(type) => {
                  if (type === 'document') fileInputRef.current?.click();
                  else if (type === 'media') mediaInputRef.current?.click();
                  else if (type === 'poll') setShowPollModal(true);
                  else if (type === 'event') setShowEventModal(true);
                  else if (type === 'contact') setShowContactModal(true);
                  else if (type === 'audio') audioInputRef.current?.click();
                  else if (type === 'sticker') setShowStickerPicker(true);
                  else if (type === 'camera') setShowCameraModal(true);
                }}
              />
            )}
          </div>
          <div className="relative shrink-0">
            <button 
              ref={emojiButtonRef}
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isRecording}
              className="p-2 md:p-3 text-muted hover:text-text hover:bg-bg rounded-xl transition-colors shrink-0 disabled:opacity-50"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showEmojiPicker && (
                <PortalModal>
                  <div 
                    className="fixed z-[9999]" 
                    style={{ top: inputEmojiPickerPos.top, left: inputEmojiPickerPos.left }}
                  >
                    <motion.div 
                      ref={emojiPickerRef}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                      <div className="bg-surface rounded-2xl border border-border shadow-2xl p-1 relative">
                        <div className="absolute top-2 right-2 z-10">
                          <button 
                            onClick={() => setShowEmojiPicker(false)}
                            className="p-1.5 bg-bg/60 backdrop-blur-md text-muted hover:text-text rounded-full transition-colors border border-border"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <EmojiPicker 
                          onEmojiClick={(emojiData) => {
                            setNewMessage(prev => prev + emojiData.emoji);
                          }}
                          theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                          width={320}
                          height={400}
                          skinTonesDisabled
                          lazyLoadEmojis
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    </motion.div>
                  </div>
                </PortalModal>
              )}
            </AnimatePresence>
          </div>
          
          {isRecording ? (
            <div className="flex-1 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono font-bold text-primary">{formatDuration(recordingDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={isRecordingPaused ? resumeRecording : pauseRecording}
                  className="p-1.5 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                >
                  {isRecordingPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button 
                  type="button"
                  onClick={cancelRecording}
                  className="p-1.5 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={stopRecording}
                  className="p-1.5 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : recordedBlob ? (
            <div className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted uppercase">Voice Note Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setRecordedBlob(null)}
                  className="p-1.5 text-muted hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <textarea 
              value={newMessage}
              onChange={handleInputChange}
              placeholder={`Message ${displayName}...`}
              className="flex-1 bg-bg/50 border border-border rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted/50 min-w-0 resize-none max-h-32"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
          )}

          {newMessage.trim() || recordedBlob ? (
            <button 
              type="submit"
              onClick={recordedBlob ? (e) => { e.preventDefault(); handleSendAudioMessage(); } : undefined}
              disabled={isUploading}
              className="p-2 md:p-3 bg-primary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 scale-110"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          ) : (
            <button 
              type="button"
              onClick={startRecording}
              disabled={isUploading}
              className="p-2 md:p-3 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors shrink-0"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>

      {/* Buddy AI Sidebar Chatbot */}
      {isBuddyOpen && (
        <div className="absolute top-16 md:top-20 right-0 bottom-0 w-80 md:w-96 bg-surface border-l border-border shadow-2xl flex flex-col z-20 animate-in slide-in-from-right">
          <div className="p-4 border-b border-border flex items-center justify-between bg-primary/10">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Bot className="w-5 h-5" />
              Python NLP Buddy
              <div className="flex items-center gap-1.5 ml-2">
                <div className={`w-2 h-2 rounded-full ${buddyStatus === 'online' ? 'bg-green-500 animate-pulse' : buddyStatus === 'offline' ? 'bg-red-500' : 'bg-muted'}`} />
                <span className="text-[10px] uppercase tracking-wider font-medium text-muted">
                  {buddyStatus}
                </span>
              </div>
            </div>
            <button onClick={() => setIsBuddyOpen(false)} className="text-muted hover:text-text">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div ref={buddyScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {buddyMessages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="text-sm text-muted">
                  I'm your custom Python-powered NLP buddy. I can read the chat context and help you understand things better!
                </p>
                <button 
                  onClick={() => askBuddy()}
                  disabled={isAiLoading}
                  className="mt-4 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isAiLoading ? "Analyzing Chat..." : "Help me understand this chat"}
                </button>
              </div>
            )}
            
            {buddyMessages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-bg text-text rounded-tl-sm border border-primary/20'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isAiLoading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary animate-pulse" />
                </div>
                <div className="bg-bg p-3 rounded-2xl rounded-tl-sm text-xs text-muted italic">
                  Buddy is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-surface/50">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (buddyInput.trim() && !isAiLoading) {
                  const text = buddyInput;
                  setBuddyInput('');
                  askBuddy(text);
                }
              }}
              className="flex items-center gap-2"
            >
              <input 
                type="text"
                value={buddyInput}
                onChange={(e) => setBuddyInput(e.target.value)}
                placeholder="Ask Buddy anything..."
                className="flex-1 bg-bg/50 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-all"
              />
              <button 
                type="submit"
                disabled={!buddyInput.trim() || isAiLoading}
                className="p-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Group Info Modal */}
      {isGroupInfoOpen && (isPublic || chat?.type === 'group') && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-text">{chat.name}</h3>
                  <p className="text-xs text-muted">{chat.members || membersList?.length || 0} members {isPublic && `• ${chat.topic}`}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsGroupInfoOpen(false)}
                className="text-muted hover:text-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Pinned Posts */}
              {isPublic && chat.pinnedPosts && chat.pinnedPosts.length > 0 && (
                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <Pin className="w-3 h-3 text-primary" /> Pinned Posts ({chat.pinnedPosts.length})
                  </h4>
                  <div className="space-y-2">
                    {chat.pinnedPosts.map((msgId: string) => {
                      const msg = displayMessages.find(m => m.id === msgId);
                      if (!msg) return null;
                      return (
                        <div key={msgId} className="p-3 bg-primary/5 border border-primary/20 rounded-xl relative group">
                          <p className="text-sm text-text line-clamp-2 pr-8">{msg.text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-muted font-medium">{nicknames[msg.senderId] || msg.senderName}</span>
                            <span className="text-[10px] text-muted opacity-50">•</span>
                            <span className="text-[10px] text-muted">{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
                          </div>
                          {isAdmin && (
                            <button 
                              onClick={() => handlePinMessage(msgId)}
                              className="absolute top-2 right-2 p-1 rounded-md text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Privacy Settings (Admin Only, Public Groups Only) */}
              {isAdmin && isPublic && (
                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <SettingsIcon className="w-3 h-3" /> Group Settings
                  </h4>
                  <div className="bg-bg/50 border border-border rounded-xl p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Privacy Level</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['public', 'private', 'hidden'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => handleUpdatePrivacy(p)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${chat.privacy === p ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-border text-muted hover:border-muted'}`}
                          >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] text-muted italic">
                        {chat.privacy === 'public' && "Anyone can see and join without approval."}
                        {chat.privacy === 'private' && "Only approved members can see content and participate."}
                        {chat.privacy === 'hidden' && "Only members with a direct link can join."}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Advanced Settings (Admin Only, Public Groups Only) */}
              {isAdmin && isPublic && (
                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Advanced Controls
                  </h4>
                  <div className="bg-bg/50 border border-border rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text">Post Approval</p>
                        <p className="text-[10px] text-muted">Admins must approve posts before they are visible.</p>
                      </div>
                      <button 
                        onClick={() => handleUpdateGroupSetting('postApprovalRequired', !chat.postApprovalRequired)}
                        className={`w-10 h-5 rounded-full transition-all relative ${chat.postApprovalRequired ? 'bg-primary' : 'bg-border'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${chat.postApprovalRequired ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-text mb-2">Allowed Media</p>
                      <div className="flex flex-wrap gap-2">
                        {['images', 'videos', 'files', 'links'].map(type => {
                          const current = chat.allowedMedia || ['images', 'videos', 'files', 'links'];
                          const isAllowed = current.includes(type);
                          return (
                            <button
                              key={type}
                              onClick={() => {
                                const updated = isAllowed 
                                  ? current.filter(t => t !== type)
                                  : [...current, type];
                                handleUpdateGroupSetting('allowedMedia', updated);
                              }}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all border ${isAllowed ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-border text-muted'}`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Join Requests (Admin Only, Public Groups Only) */}
              {isAdmin && isPublic && chat.pendingRequests && chat.pendingRequests.length > 0 && (
                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3 text-amber-500" /> Pending Requests ({chat.pendingRequests.length})
                  </h4>
                  <div className="space-y-2">
                    {chat.pendingRequests.map((reqId: string) => {
                      const user = availableUsers.find(u => u.id === reqId);
                      return (
                        <div key={reqId} className="flex items-center justify-between p-3 bg-bg/50 border border-border rounded-xl">
                          <div className="flex items-center gap-3">
                            <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reqId}`} className="w-8 h-8 rounded-lg" alt="" referrerPolicy="no-referrer" />
                            <span className="text-sm font-medium text-text">{user?.name || 'Unknown User'}</span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleDeclineRequest(reqId)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApproveRequest(reqId)}
                              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Group Analytics (Admin Only) */}
              {isAdmin && (
                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" /> Group Analytics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg/50 border border-border rounded-xl p-4">
                      <p className="text-xs text-muted mb-1">Total Messages</p>
                      <p className="text-xl font-bold text-text">{displayMessages.length}</p>
                    </div>
                    <div className="bg-bg/50 border border-border rounded-xl p-4">
                      <p className="text-xs text-muted mb-1">Active Members</p>
                      <p className="text-xl font-bold text-text">{membersList?.length || 0}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Activity Log (Admin Only) */}
              {isAdmin && (
                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Recent Activity
                  </h4>
                  <div className="bg-bg/50 border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3 text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-muted">Group created by {availableUsers.find(u => u.id === chat.creatorId)?.name || 'Admin'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-muted">Privacy set to {chat.privacy}</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Members List */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3 h-3" /> Members ({chat.members || membersList?.length || 0})
                  </h4>
                  {isAdmin && (
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted" />
                      <input 
                        type="text"
                        placeholder="Add member..."
                        value={searchUserQuery}
                        onChange={(e) => setSearchUserQuery(e.target.value)}
                        className="bg-bg/50 border border-border rounded-lg pl-7 pr-3 py-1 text-[10px] text-text focus:outline-none focus:border-primary w-40"
                      />
                      {searchUserQuery && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto custom-scrollbar">
                          {availableUsers
                            .filter(u => u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) && !membersList?.includes(u.id))
                            .map(user => (
                              <button
                                key={user.id}
                                onClick={() => {
                                  handleAddMember(user.id);
                                  setSearchUserQuery('');
                                }}
                                className="w-full flex items-center gap-2 p-2 hover:bg-bg transition-colors text-left"
                              >
                                <img src={user.avatar} className="w-6 h-6 rounded-md" alt="" referrerPolicy="no-referrer" />
                                <span className="text-[10px] font-medium text-text truncate">{user.name}</span>
                                <Plus className="w-3 h-3 ml-auto text-primary" />
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {membersList?.map((memberId: string) => {
                    const user = availableUsers.find(u => u.id === memberId);
                    const userRole = chat.roles?.[memberId] || 'member';
                    const userNickname = nicknames[memberId];
                    return (
                      <div key={memberId} className="flex items-center justify-between p-3 bg-bg/50 border border-border rounded-xl group/member">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`} className="w-8 h-8 rounded-lg" alt="" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text truncate flex items-center gap-1">
                              {userNickname || user?.name || 'Unknown User'}
                              {userNickname && <span className="text-[10px] text-muted italic font-normal">({user?.name})</span>}
                            </p>
                            <p className="text-[10px] text-muted uppercase font-bold tracking-wider">{userRole}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {memberId !== currentUser.id && (
                            <button 
                              onClick={() => handleSetNickname(memberId, user?.name || 'User')}
                              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover/member:opacity-100"
                              title="Set Nickname"
                            >
                              <UserIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && memberId !== chat.creatorId && (
                            <>
                              <select 
                                value={userRole}
                                onChange={(e) => handleUpdateRole(memberId, e.target.value as any)}
                                className="bg-transparent border-none text-[10px] text-muted focus:ring-0 cursor-pointer"
                              >
                                <option value="member">Member</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button 
                                onClick={() => handleRemoveMember(memberId)}
                                className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Remove Member"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleBanMember(memberId)}
                                className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Ban Member"
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {memberId === chat.creatorId && (
                            <ShieldCheck className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
      {isThemesOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-text flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" /> Select Theme
              </h3>
              <button onClick={() => setIsThemesOpen(false)} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {[
                { name: 'Default', class: 'bg-bg' },
                { name: 'Ocean', class: 'bg-blue-900/20 border-blue-500/30' },
                { name: 'Sunset', class: 'bg-orange-900/20 border-orange-500/30' },
                { name: 'Forest', class: 'bg-emerald-900/20 border-emerald-500/30' },
                { name: 'Galaxy', class: 'bg-indigo-900/20 border-indigo-500/30' },
                { name: 'Lava', class: 'bg-red-900/20 border-red-500/30' },
                { name: 'Cyberpunk', class: 'bg-pink-900/20 border-pink-500/30' },
                { name: 'Midnight', class: 'bg-slate-900 border-slate-700' },
                { name: 'Minimal', class: 'bg-white text-black' },
              ].map((theme, i) => (
                <button 
                  key={i}
                  onClick={() => handleThemeSelect(i)}
                  className={`w-full p-4 rounded-xl border transition-all hover:scale-[1.02] flex flex-col items-center gap-2 ${theme.class}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/40 shadow-inner" />
                  <span className="text-xs font-medium">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nickname Modal */}
      {editingNicknameUserId && (
        <PortalModal>
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
              <h3 className="font-bold text-lg text-text mb-4">Set Nickname</h3>
              <p className="text-sm text-muted mb-4">Nicknames are only visible in this conversation.</p>
              <input 
                type="text"
                value={newNicknameValue}
                onChange={(e) => setNewNicknameValue(e.target.value)}
                placeholder="Enter nickname..."
                className="w-full bg-bg/50 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary mb-6"
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingNicknameUserId(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-muted hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveNickname}
                  className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Edit Message Modal */}
      {editingMessage && (
        <PortalModal>
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95">
              <h3 className="font-bold text-lg text-text mb-4">Edit Message</h3>
              <textarea 
                value={editingMessage.text}
                onChange={(e) => setEditingMessage({...editingMessage, text: e.target.value})}
                className="w-full bg-bg/50 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary mb-6 resize-none"
                rows={4}
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingMessage(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-muted hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleEditMessage(editingMessage.id, editingMessage.text)}
                  className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Chat Controls Modal */}
      {isChatControlsOpen && (
        <PortalModal>
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-text flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-primary" /> Chat Controls
                </h3>
                <button onClick={() => setIsChatControlsOpen(false)} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                <section className="space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Message Requests</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-bg/50 rounded-xl border border-border">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">Followers</p>
                        <p className="text-[10px] text-muted">Go to Inbox</p>
                      </div>
                      <div className="w-10 h-5 bg-primary rounded-full relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-bg/50 rounded-xl border border-border">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">Others on Instagram</p>
                        <p className="text-[10px] text-muted">Go to Requests</p>
                      </div>
                      <div className="w-10 h-5 bg-muted rounded-full relative"><div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                    </div>
                  </div>
                </section>
                <section className="space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Group Settings</h4>
                  <div className="flex items-center justify-between p-3 bg-bg/50 rounded-xl border border-border">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">Who can add you to groups</p>
                      <p className="text-[10px] text-muted">Only people you follow</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Privacy & Safety Modal */}
      {isPrivacySafetyOpen && (
        <PortalModal>
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-text flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" /> Privacy & Safety
                </h3>
                <button onClick={() => setIsPrivacySafetyOpen(false)} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                <section className="space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Safety Tools</h4>
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-3 bg-bg/50 rounded-xl border border-border hover:bg-bg transition-colors">
                      <div className="flex items-center gap-3">
                        <Ban className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium text-text">Block User</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 bg-bg/50 rounded-xl border border-border hover:bg-bg transition-colors">
                      <div className="flex items-center gap-3">
                        <EyeOff className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-text">Restrict User</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted" />
                    </button>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Hidden Words</h4>
                  <p className="text-[10px] text-muted">Messages containing these words will be hidden automatically.</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newHiddenWord}
                      onChange={(e) => setNewHiddenWord(e.target.value)}
                      placeholder="Add word..."
                      className="flex-1 bg-bg/50 border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddHiddenWord()}
                    />
                    <button 
                      onClick={handleAddHiddenWord}
                      className="p-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hiddenWords.map(word => (
                      <span key={word} className="flex items-center gap-1 px-2 py-1 bg-surface border border-border rounded-md text-[10px] text-text">
                        {word}
                        <button onClick={() => handleRemoveHiddenWord(word)} className="text-muted hover:text-red-400"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Reporting</h4>
                  <button className="w-full flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors text-red-500">
                    <div className="flex items-center gap-3">
                      <Flag className="w-4 h-4" />
                      <span className="text-sm font-medium">Report Conversation</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </section>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Study Tools Modal */}
      {isToolsOpen && (
        <PortalModal>
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-text flex items-center gap-2">
                  <Layout className="w-5 h-5 text-primary" /> Study Tools
                </h3>
                <button onClick={() => setIsToolsOpen(false)} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setShowSharedFiles(true); setIsToolsOpen(false); }}
                  className="flex flex-col items-center gap-3 p-6 bg-bg/50 rounded-2xl border border-border hover:border-primary transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <File className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-text">Shared Files</span>
                </button>
                <button 
                  onClick={() => { setShowPollModal(true); setIsToolsOpen(false); }}
                  className="flex flex-col items-center gap-3 p-6 bg-bg/50 rounded-2xl border border-border hover:border-primary transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-text">Polls</span>
                </button>
                <button 
                  onClick={() => { setShowEventModal(true); setIsToolsOpen(false); }}
                  className="flex flex-col items-center gap-3 p-6 bg-bg/50 rounded-2xl border border-border hover:border-primary transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-text">Events</span>
                </button>
                <button className="flex flex-col items-center gap-3 p-6 bg-bg/50 rounded-2xl border border-border hover:border-primary transition-all group opacity-50 cursor-not-allowed">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-text">AI Notes</span>
                  <span className="text-[8px] uppercase text-muted">Coming Soon</span>
                </button>
              </div>
            </div>
          </div>
        </PortalModal>
      )}
      {isModalOpen && (
        <FilePreviewModal 
          files={pendingFiles} 
          onClose={() => setIsModalOpen(false)} 
          onSend={sendFiles} 
          onAddFiles={(newFiles) => setPendingFiles(prev => [...prev, ...newFiles])}
        />
      )}
      {showSharedFiles && (
        <PortalModal>
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-text flex items-center gap-2">
                  <File className="w-5 h-5 text-primary" /> Shared Files
                </h3>
                <button onClick={() => setShowSharedFiles(false)} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {messages.filter(m => m.fileUrl || (m.mediaUrls && m.mediaUrls.length > 0)).map(msg => {
                    const isVideo = (type?: string, url?: string, name?: string) => {
                      if (type?.startsWith('video/') || type === 'video') return true;
                      const lowerUrl = url?.toLowerCase() || '';
                      const lowerName = name?.toLowerCase() || '';
                      if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg') || lowerUrl.includes('.mov')) return true;
                      if (lowerName.endsWith('.mp4') || lowerName.endsWith('.webm') || lowerName.endsWith('.ogg') || lowerName.endsWith('.mov')) return true;
                      return false;
                    };
                    const isImage = (type?: string, url?: string, name?: string) => {
                      if (type?.startsWith('image/') || type === 'image') return true;
                      const lowerUrl = url?.toLowerCase() || '';
                      const lowerName = name?.toLowerCase() || '';
                      if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || lowerUrl.includes('.gif') || lowerUrl.includes('.webp') || lowerUrl.includes('.svg')) return true;
                      if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.gif') || lowerName.endsWith('.webp') || lowerName.endsWith('.svg')) return true;
                      return false;
                    };

                    return (
                      <div key={msg.id} className="group relative aspect-square bg-bg/50 rounded-xl border border-border overflow-hidden hover:border-primary transition-all">
                        {msg.mediaUrls && msg.mediaUrls[0] ? (
                          <img 
                            src={msg.mediaUrls[0]} 
                            alt="" 
                            className="w-full h-full object-cover cursor-pointer" 
                            referrerPolicy="no-referrer" 
                            onClick={() => setLightboxUrl(msg.mediaUrls![0])}
                          />
                        ) : (msg.fileUrl && isImage(msg.fileType, msg.fileUrl, msg.fileName)) ? (
                          <img 
                            src={msg.fileUrl} 
                            alt="" 
                            className="w-full h-full object-cover cursor-pointer" 
                            referrerPolicy="no-referrer" 
                            onClick={() => setLightboxUrl(msg.fileUrl!)}
                          />
                        ) : (msg.fileUrl && isVideo(msg.fileType, msg.fileUrl, msg.fileName)) ? (
                          <div className="w-full h-full relative">
                            <video src={msg.fileUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="w-8 h-8 text-white opacity-80" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                            <File className="w-8 h-8 text-primary mb-2" />
                            <span className="text-[10px] font-medium text-text truncate w-full px-2">{msg.fileName}</span>
                            <span className="text-[8px] text-muted uppercase mt-1">{(msg.fileSize ? (msg.fileSize / 1024).toFixed(1) : 0)} KB</span>
                          </div>
                        )}
                        <a 
                          href={msg.fileUrl || msg.mediaUrls?.[0]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                            <Download className="w-5 h-5" />
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </div>
                {messages.filter(m => m.fileUrl || (m.mediaUrls && m.mediaUrls.length > 0)).length === 0 && (
                  <div className="text-center py-12 text-muted">
                    <File className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No files shared in this chat yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PortalModal>
      )}
      {showPollModal && (
        <PollModal 
          onClose={() => setShowPollModal(false)}
          onSend={handleSendPoll}
        />
      )}
      {showEventModal && (
        <EventModal 
          onClose={() => setShowEventModal(false)}
          onSend={handleSendEvent}
        />
      )}
      {showContactModal && (
        <ContactModal 
          currentUser={currentUser}
          onClose={() => setShowContactModal(false)}
          onSend={handleSendContacts}
        />
      )}
      {showAudioRecorder && (
        <AudioRecorder 
          onClose={() => setShowAudioRecorder(false)}
          onSend={handleSendAudio}
        />
      )}
      {showStickerPicker && (
        <StickerPicker 
          onClose={() => setShowStickerPicker(false)}
          onSelect={handleSendSticker}
        />
      )}
      {forwardingMessage && (
        <ForwardModal 
          message={forwardingMessage}
          onClose={() => setForwardingMessage(null)}
          onForward={(chatIds) => handleForwardMessage(chatIds, forwardingMessage)}
        />
      )}
      {showCameraModal && (
        <CameraModal 
          onClose={() => setShowCameraModal(false)}
          onCapture={handleSendCameraCapture}
        />
      )}
      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}
