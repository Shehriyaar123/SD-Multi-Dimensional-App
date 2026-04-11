import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Shield, Palette, Globe, Monitor, Lock, Key, 
  Bell, Eye, Smartphone, LogOut, Save, Camera, 
  Languages, Moon, Sun, Laptop, Check, X, 
  Settings as SettingsIcon, AppWindow, Zap, Info, Mail, LayoutDashboard, Menu, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings, Theme } from '../../../contexts/SettingsContext';
import { SUPPORTED_LANGUAGES } from '../../../constants/languages';
import { auth } from '../../../firebase';
import { useNavigate } from 'react-router-dom';

export default function SettingsView({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { 
    theme, setTheme, 
    userProfile, setUserProfile, 
    securitySettings, setSecuritySettings,
    appCustomization, setAppCustomization,
    globalLanguage, setGlobalLanguage,
    revokeSession,
    logout
  } = useSettings();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'app'>('profile');
  const [localProfile, setLocalProfile] = useState(userProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Update local profile when global profile changes (e.g. on initial load)
  useEffect(() => {
    setLocalProfile(userProfile);
  }, [userProfile]);

  const handleSaveProfile = () => {
    setIsSaving(true);
    // In our new SettingsContext, setUserProfile will trigger a Firestore sync
    setUserProfile(localProfile);
    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleToggle2FA = () => {
    if (!securitySettings.twoFactorEnabled) {
      setShow2FAModal(true);
    } else {
      setSecuritySettings({...securitySettings, twoFactorEnabled: false});
    }
  };

  const confirm2FA = () => {
    if (verificationCode === '123456') {
      setSecuritySettings({...securitySettings, twoFactorEnabled: true});
      setShow2FAModal(false);
      setVerificationCode('');
    } else {
      alert("Invalid verification code. Use 123456 for demo.");
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'app', label: 'Application', icon: AppWindow },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg/50 backdrop-blur-xl relative">
      <div className="p-4 md:p-8 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/select-dimension" className="md:hidden p-2 -ml-2 text-muted hover:text-text shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <button onClick={onOpenSidebar} className="md:hidden p-2 text-muted hover:text-text shrink-0">
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-display font-black tracking-tight text-text">Settings</h2>
            <p className="text-muted text-[10px] md:text-sm mt-0.5 md:mt-1">Manage your account and platform preferences</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-border">
          <SettingsIcon className="w-4 h-4 text-muted" />
          <span className="text-xs font-mono text-muted uppercase tracking-widest">v2.4.0-stable</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 border-r border-border p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted hover:bg-surface-hover hover:text-text'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          
          <div className="pt-8 mt-8 border-t border-border space-y-1">
            <button 
              onClick={() => navigate('/select-dimension')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted hover:bg-surface-hover hover:text-text transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to Hub
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <div className="max-w-2xl mx-auto">
            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <img src={localProfile.avatar} alt="Avatar" className="w-24 h-24 rounded-2xl border-2 border-border group-hover:opacity-50 transition-opacity" />
                    <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text">{localProfile.name}</h3>
                    <p className="text-muted text-sm">Personalize your identity across the platform</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Display Name</label>
                    <input 
                      type="text" 
                      value={localProfile.name}
                      onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-muted" />
                      </div>
                      <input 
                        type="email" 
                        value={localProfile.email}
                        disabled
                        className="w-full bg-surface/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-muted cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Location</label>
                    <input 
                      type="text" 
                      value={localProfile.location}
                      onChange={(e) => setLocalProfile({...localProfile, location: e.target.value})}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Timezone</label>
                    <input 
                      type="text" 
                      value={localProfile.timezone}
                      onChange={(e) => setLocalProfile({...localProfile, timezone: e.target.value})}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Bio</label>
                  <textarea 
                    value={localProfile.bio}
                    onChange={(e) => setLocalProfile({...localProfile, bio: e.target.value})}
                    rows={4}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Zap className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-surface/50 border border-border rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-text">Two-Factor Authentication</p>
                        <p className="text-xs text-muted">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleToggle2FA}
                      className={`w-12 h-6 rounded-full transition-colors relative ${(securitySettings?.twoFactorEnabled) ? 'bg-emerald-500' : 'bg-border'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${(securitySettings?.twoFactorEnabled) ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-text">Default Encryption Key</p>
                        <p className="text-xs text-muted">Set a global key for secure messaging</p>
                      </div>
                    </div>
                    <input 
                      type="password" 
                      placeholder="Enter key..."
                      value={securitySettings?.defaultEncryptionKey || ''}
                      onChange={(e) => setSecuritySettings({...securitySettings, defaultEncryptionKey: e.target.value})}
                      className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Active Sessions</h4>
                  <div className="bg-surface/50 border border-border rounded-2xl divide-y divide-border">
                    {(securitySettings?.activeSessions || []).length === 0 ? (
                      <div className="p-8 text-center text-muted text-sm">No active sessions found.</div>
                    ) : (
                      (securitySettings?.activeSessions || []).map((session, index) => (
                        <div key={`${session.id}-${index}`} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {(session.userAgent || '').includes('Mobile') ? <Smartphone className="w-4 h-4 text-muted" /> : <Laptop className="w-4 h-4 text-muted" />}
                            <div>
                              <p className="text-sm font-medium truncate max-w-[250px] text-text">{session.userAgent || 'Unknown Device'}</p>
                              <p className="text-[10px] text-muted">
                                {session.id === localStorage.getItem('session_id') ? (
                                  <span className="text-emerald-500 font-bold uppercase tracking-tighter">Current Session</span>
                                ) : (
                                  `Last active: ${session.lastActive?.toDate ? session.lastActive.toDate().toLocaleString() : 'Just now'}`
                                )}
                              </p>
                            </div>
                          </div>
                          {session.id !== localStorage.getItem('session_id') && (
                            <button 
                              onClick={() => revokeSession(session.id)}
                              className="text-xs text-red-400 hover:underline px-2 py-1 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Theme Mode</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Laptop },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setTheme(mode.id as Theme)}
                        className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                          theme === mode.id 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-border bg-surface/50 text-muted hover:border-text/30'
                        }`}
                      >
                        <mode.icon className="w-6 h-6" />
                        <span className="text-sm font-bold">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Accent Color</h4>
                  <div className="flex gap-4">
                    {['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setAppCustomization({...appCustomization, primaryColor: color})}
                        className="w-10 h-10 rounded-full border-4 border-bg transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        {appCustomization?.primaryColor === color && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface/50 border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-text">Compact Mode</p>
                      <p className="text-xs text-muted">Reduce spacing and font sizes for high-density viewing</p>
                    </div>
                    <button 
                      onClick={() => setAppCustomization({...appCustomization, compactMode: !appCustomization?.compactMode})}
                      className={`w-12 h-6 rounded-full transition-colors relative ${appCustomization?.compactMode ? 'bg-blue-500' : 'bg-border'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appCustomization?.compactMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'app' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Global Translation</h4>
                  <div className="bg-surface/50 border border-border rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-muted" />
                        <div>
                          <p className="text-sm font-medium text-text">Default Language</p>
                          <p className="text-xs text-muted">Translate all incoming messages automatically</p>
                        </div>
                      </div>
                      <select 
                        value={globalLanguage || ''} 
                        onChange={(e) => setGlobalLanguage(e.target.value || null)}
                        className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                      >
                        <option value="">Original (Off)</option>
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Features</h4>
                  <div className="bg-surface/50 border border-border rounded-2xl divide-y divide-border">
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-text">AI Buddy Assistant</p>
                        <p className="text-xs text-muted">Enable the floating AI companion in chats</p>
                      </div>
                      <button 
                        onClick={() => setAppCustomization({...appCustomization, enableAiBuddy: !appCustomization?.enableAiBuddy})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${appCustomization?.enableAiBuddy ? 'bg-primary' : 'bg-border'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appCustomization?.enableAiBuddy ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-text">Activity Status</p>
                        <p className="text-xs text-muted">Show your online/offline status to others</p>
                      </div>
                      <button 
                        onClick={() => setAppCustomization({...appCustomization, showActivityStatus: !appCustomization?.showActivityStatus})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${appCustomization?.showActivityStatus ? 'bg-primary' : 'bg-border'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appCustomization?.showActivityStatus ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl flex items-start gap-4">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-primary">Application Editing</p>
                    <p className="text-xs text-primary/70 mt-1 leading-relaxed">
                      Advanced customization allows you to modify the platform's layout and core behavior. 
                      Some changes may require a platform restart to take full effect.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {show2FAModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6 mx-auto">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2 text-text">Verify Identity</h3>
              <p className="text-muted text-sm text-center mb-8">Enter the 6-digit code sent to your email to enable 2FA.</p>
              
              <input 
                type="text" 
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                className="w-full bg-bg border border-border rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] text-text focus:ring-2 focus:ring-primary outline-none mb-6"
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-bg text-muted font-bold hover:bg-surface transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirm2FA}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-all"
                >
                  Verify
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
