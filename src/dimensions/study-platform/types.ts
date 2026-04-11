export interface User {
  id: string;
  name: string;
  avatar: string;
  timezone: string;
  location: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export interface Group {
  id: string;
  name: string;
  members: number;
  topic: string;
  isJoined?: boolean;
  creatorId: string;
  privacy: 'public' | 'private' | 'hidden';
  membersList: string[];
  roles: Record<string, 'admin' | 'moderator' | 'member'>;
  pendingRequests?: string[];
  maxMembers?: number;
  postApprovalRequired?: boolean;
  allowedMedia?: ('text' | 'image' | 'video' | 'link')[];
  pinnedPosts?: string[];
  bannedUsers?: string[];
  createdAt?: any;
  theme?: string; // theme identifier
  backgroundImage?: string; // URL
}

export interface PrivateChat {
  id: string;
  name: string;
  type: 'dm' | 'group';
  timezone?: string;
  location?: string;
  localTime?: string;
  avatar: string;
  status?: 'online' | 'offline';
  members?: number;
  role?: 'student' | 'teacher' | 'personal' | 'admin';
  participants?: string[];
  participantDetails?: Record<string, { name: string, avatar: string }>;
  theme?: string; // theme identifier
  backgroundImage?: string; // URL
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
  timezone: string;
  location: string;
  localTime: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  type?: 'text' | 'poll' | 'event' | 'contact' | 'audio' | 'sticker' | 'file' | 'mediaGroup';
  mediaUrls?: string[];
  mediaTypes?: ('image' | 'video')[];
  question?: string;
  options?: { text: string, votes: string[] }[];
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  eventRSVPs?: Record<string, 'going' | 'maybe' | 'not-going'>;
  contactName?: string;
  contactPhone?: string;
  contactVCard?: string;
  audioUrl?: string;
  audioDuration?: number;
  isVoiceNote?: boolean;
  stickerId?: string;
  stickerPack?: string;
  stickerUrl?: string;
  contact?: {
    name: string;
    avatar: string;
    id: string;
  };
  caption?: string;
  status?: 'sent' | 'pending' | 'failed' | 'sending';
  createdAt?: any;
  reactions?: Record<string, string>; // userId -> emoji
  deletedFor?: string[]; // userIds who deleted the message
  replyTo?: { id: string, text: string, senderName: string, senderId: string }; // messageId, text, senderName, and senderId
  isEdited?: boolean;
  editedAt?: any;
  stableKey?: string;
  clientGeneratedId?: string;
}

export interface UserStats {
  focusLevel: number;
  cognitiveLoad: string;
  sessionDuration: string;
  sessionStartTime?: number;
  currentActivity?: string;
  activityLog: Array<{
    time: string;
    title: string;
    icon: string;
    color: string;
    bg: string;
  }>;
}

export interface ConnectionRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  toName: string;
  toAvatar: string;
  participants: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}
