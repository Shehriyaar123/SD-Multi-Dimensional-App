import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, serverTimestamp, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type Theme = 'dark' | 'light' | 'system';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  timezone: string;
  location: string;
  bio: string;
}

interface Session {
  id: string;
  userAgent: string;
  lastActive: any;
  ip?: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastLogin: string;
  activeSessions: Session[];
  defaultEncryptionKey: string;
}

interface AppCustomization {
  showActivityStatus: boolean;
  compactMode: boolean;
  enableAiBuddy: boolean;
  primaryColor: string;
}

interface SettingsContextType {
  globalLanguage: string | null;
  setGlobalLanguage: (lang: string | null) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  securitySettings: SecuritySettings;
  setSecuritySettings: (settings: SecuritySettings) => void;
  appCustomization: AppCustomization;
  setAppCustomization: (customization: AppCustomization) => void;
  loading: boolean;
  user: FirebaseUser | null;
  revokeSession: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalLanguage, setGlobalLanguage] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "guest",
    name: "Guest",
    email: "",
    avatar: "https://picsum.photos/seed/guest/100/100",
    timezone: "UTC",
    location: "Unknown",
    bio: ""
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    lastLogin: new Date().toLocaleString(),
    activeSessions: [],
    defaultEncryptionKey: ""
  });
  const [appCustomization, setAppCustomization] = useState<AppCustomization>({
    showActivityStatus: true,
    compactMode: false,
    enableAiBuddy: true,
    primaryColor: "#3b82f6" // blue-500
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setLoading(false);
        // Reset to guest if logged out
        setUserProfile({
          id: "guest",
          name: "Guest",
          email: "",
          avatar: "https://picsum.photos/seed/guest/100/100",
          timezone: "UTC",
          location: "Unknown",
          bio: ""
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Session Tracking
  useEffect(() => {
    if (!user) return;

    const sessionId = localStorage.getItem('session_id') || Math.random().toString(36).substring(7);
    localStorage.setItem('session_id', sessionId);

    const sessionDocRef = doc(db, "users", user.uid, "sessions", sessionId);
    
    const updateSession = async () => {
      await setDoc(sessionDocRef, {
        id: sessionId,
        userAgent: navigator.userAgent,
        lastActive: serverTimestamp(),
      }, { merge: true });
    };

    updateSession();
    const interval = setInterval(updateSession, 60000); // Update every minute

    // Listen to all sessions
    const sessionsQuery = collection(db, "users", user.uid, "sessions");
    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      const sessions: Session[] = [];
      snapshot.forEach(doc => {
        sessions.push(doc.data() as Session);
      });
      setSecuritySettings(prev => ({ ...prev, activeSessions: sessions }));
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [user]);

  // Firestore Profile Listener
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    
    // Use onSnapshot for real-time updates from Firestore
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          id: user.uid,
          name: data.name || user.displayName || "User",
          email: user.email || data.email || "",
          avatar: data.avatar || user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
          timezone: data.timezone || "UTC",
          location: data.location || "Unknown",
          bio: data.bio || ""
        });
        
        // Also load settings if they exist in the doc
        if (data.settings) {
          if (data.settings.theme) setTheme(data.settings.theme);
          if (data.settings.globalLanguage) setGlobalLanguage(data.settings.globalLanguage);
          if (data.settings.security) setSecuritySettings(prev => ({ ...prev, ...data.settings.security }));
          if (data.settings.customization) setAppCustomization(prev => ({ ...prev, ...data.settings.customization }));
        }
      } else {
        // If doc doesn't exist, create a basic one
        const initialProfile = {
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email || "",
          avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          location: "Local",
          bio: "",
          role: "student" // Default role
        };
        setDoc(userDocRef, initialProfile);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync settings to Firestore when they change
  useEffect(() => {
    if (!user || loading) return;

    const syncSettings = async () => {
      const userDocRef = doc(db, "users", user.uid);
      try {
        await setDoc(userDocRef, {
          name: userProfile.name,
          avatar: userProfile.avatar,
          timezone: userProfile.timezone,
          location: userProfile.location,
          bio: userProfile.bio,
          settings: {
            theme,
            globalLanguage,
            security: {
              twoFactorEnabled: securitySettings.twoFactorEnabled,
              lastLogin: securitySettings.lastLogin,
              defaultEncryptionKey: securitySettings.defaultEncryptionKey
            },
            customization: appCustomization
          }
        }, { merge: true });
      } catch (err) {
        console.error("Error syncing settings to Firestore:", err);
      }
    };

    // Debounce sync to avoid too many writes
    const timeoutId = setTimeout(syncSettings, 2000);
    return () => clearTimeout(timeoutId);
  }, [user, userProfile, theme, globalLanguage, securitySettings, appCustomization, loading]);

  // Theme and Customization effect
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Theme
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Primary Color
    root.style.setProperty('--primary-color', appCustomization.primaryColor);
    
    // Compact Mode
    if (appCustomization.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [theme, appCustomization.primaryColor, appCustomization.compactMode]);

  const revokeSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "sessions", sessionId));
    } catch (err) {
      console.error("Error revoking session:", err);
    }
  };

  const logout = async () => {
    if (user) {
      try {
        const statsRef = doc(db, "users", user.uid, "stats", "current");
        const statsSnap = await getDoc(statsRef);
        
        if (statsSnap.exists()) {
          const statsData = statsSnap.data();
          if (statsData.sessionStartTime) {
            const diff = Math.floor((Date.now() - statsData.sessionStartTime) / 1000);
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            const durationStr = `${h}:${m}:${s}`;
            
            // Save to past sessions
            await addDoc(collection(db, "users", user.uid, "study_sessions"), {
              startTime: statsData.sessionStartTime,
              endTime: Date.now(),
              duration: durationStr,
              durationSeconds: diff,
              focusLevel: statsData.focusLevel || 0,
              cognitiveLoad: statsData.cognitiveLoad || "Unknown",
              createdAt: serverTimestamp()
            });
            
            // Reset current session
            await updateDoc(statsRef, {
              sessionStartTime: null,
              sessionDuration: "00:00:00",
              activityLog: []
            });
          }
        }
      } catch (err) {
        console.error("Error saving session data on logout:", err);
      }
    }
    await auth.signOut();
  };

  return (
    <SettingsContext.Provider value={{ 
      globalLanguage, setGlobalLanguage, 
      theme, setTheme,
      userProfile, setUserProfile,
      securitySettings, setSecuritySettings,
      appCustomization, setAppCustomization,
      loading,
      user,
      revokeSession,
      logout
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
