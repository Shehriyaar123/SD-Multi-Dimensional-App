import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Mail, Lock, Github, Chrome, UserPlus, Sun, Moon } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, githubProvider } from "../firebase";

import { useRole, Role } from "../contexts/RoleContext";
import { useSettings } from "../contexts/SettingsContext";

export default function LoginPage() {
  const { theme, setTheme } = useSettings();
  const location = useLocation();
  const { setRole } = useRole();
  const [isLogin, setIsLogin] = useState(location.state?.isSignup ? false : true);
  const [accountType, setAccountType] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pendingOAuthUser, setPendingOAuthUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");

    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      if (!isLogin) {
        // Create Account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save to Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: name,
          role: accountType
        });
        
        setRole(accountType);
        navigate('/select-dimension');
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role as Role);
          navigate('/select-dimension');
        } else {
          setError("User profile not found in database.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthResult = async (result: any, providerName: string) => {
    try {
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        // User exists, log them in
        setRole(userDoc.data().role as Role);
        navigate('/select-dimension');
      } else {
        // New user, ask for role
        setPendingOAuthUser(user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Failed to login with ${providerName}.`);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    try {
      setError("");
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      handleOAuthResult(result, "Google");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked by your browser. Please enable popups for this site and try again.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Login request was cancelled. Please try again.");
      } else {
        setError(err.message || "Failed to login with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    if (isLoading) return;
    try {
      setError("");
      setIsLoading(true);
      const result = await signInWithPopup(auth, githubProvider);
      handleOAuthResult(result, "GitHub");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked by your browser. Please enable popups for this site and try again.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Login request was cancelled. Please try again.");
      } else {
        setError(err.message || "Failed to login with GitHub.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const completeOAuthSignup = async () => {
    if (!pendingOAuthUser || isLoading) return;
    setIsLoading(true);
    try {
      const userEmail = pendingOAuthUser.email || pendingOAuthUser.providerData[0]?.email || `${pendingOAuthUser.uid}@oauth.com`;
      
      await setDoc(doc(db, "users", pendingOAuthUser.uid), {
        uid: pendingOAuthUser.uid,
        email: userEmail,
        name: pendingOAuthUser.displayName || "User",
        role: accountType
      });
      
      setRole(accountType);
      navigate('/select-dimension');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to complete signup.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col lg:flex-row relative overflow-hidden transition-colors duration-300">
      
      {/* --- LEFT COLUMN: AUTHENTICATION --- */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen relative z-10 p-6 lg:p-12">
        {/* Background Effects for Mobile */}
        <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Navigation */}
        <nav className="mb-8 lg:mb-12 relative z-10 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted hover:text-text transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Ecosystem
          </Link>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-text transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo/Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm" />
                </div>
                <span className="text-2xl font-display font-black tracking-tight">Penta</span>
              </div>
            </div>

            {pendingOAuthUser ? (
              <div className="bg-surface/50 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold mb-2 text-text">Complete your profile</h3>
                <p className="text-sm text-muted mb-6">Select your account type to continue.</p>
                
                {error && (
                  <div className="p-3 mb-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['student', 'teacher', 'personal', 'admin'] as Role[]).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        className={`py-3 text-sm font-medium rounded-xl border transition-all ${accountType === type ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-bg/50 border-border text-muted hover:border-text/30'}`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={completeOAuthSignup}
                    disabled={isLoading}
                    className="w-full bg-text text-bg font-bold rounded-xl py-3 mt-6 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading && <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />}
                    {isLoading ? "Processing..." : "Complete Setup"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 2 Cards for Creation or Login */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`p-4 rounded-2xl border text-left transition-all ${isLogin ? 'bg-blue-500/10 border-blue-500' : 'bg-surface/50 border-border hover:border-text/30'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${isLogin ? 'bg-blue-500 text-white' : 'bg-surface text-muted'}`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <h3 className={`font-bold ${isLogin ? 'text-text' : 'text-muted'}`}>Sign In</h3>
                    <p className="text-xs text-muted/60 mt-1">Access your ecosystem</p>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`p-4 rounded-2xl border text-left transition-all ${!isLogin ? 'bg-purple-500/10 border-purple-500' : 'bg-surface/50 border-border hover:border-text/30'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${!isLogin ? 'bg-purple-500 text-white' : 'bg-surface text-muted'}`}>
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <h3 className={`font-bold ${!isLogin ? 'text-text' : 'text-muted'}`}>Create Account</h3>
                    <p className="text-xs text-muted/60 mt-1">Join the 5th dimension</p>
                  </button>
                </div>

                {/* Form Card */}
                <div className="bg-surface/50 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
                  <form className="space-y-5" onSubmit={handleAuth}>
                    
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    {!isLogin && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted uppercase tracking-wider">Account Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['student', 'teacher', 'personal', 'admin'] as Role[]).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setAccountType(type)}
                              className={`py-2 text-xs font-medium rounded-lg border transition-all ${accountType === type ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-bg/50 border-border text-muted hover:border-text/30'}`}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isLogin && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-bg/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-muted/40 text-text"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="w-4 h-4 text-muted" />
                        </div>
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-bg/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-muted/40 text-text"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted uppercase tracking-wider">Password</label>
                        {isLogin && (
                          <a href="#" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
                            Forgot?
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="w-4 h-4 text-muted" />
                        </div>
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-bg/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-muted/40 text-text"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-text text-bg font-bold rounded-xl py-3 mt-4 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading && <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />}
                      {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                    </button>
                  </form>

                  <div className="mt-8 mb-6 flex items-center">
                    <div className="flex-1 h-px bg-border" />
                    <span className="px-4 text-xs text-muted uppercase tracking-wider">Or continue with</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={handleGithubLogin}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 bg-bg/50 border border-border rounded-xl py-3 hover:bg-surface transition-colors text-text disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Github className="w-4 h-4" />
                      <span className="text-sm font-medium">GitHub</span>
                    </button>
                    <button 
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 bg-bg/50 border border-border rounded-xl py-3 hover:bg-surface transition-colors text-text disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Chrome className="w-4 h-4" />
                      <span className="text-sm font-medium">Google</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </main>
      </div>

      {/* --- RIGHT COLUMN: INFO & IMAGES --- */}
      <div className="hidden lg:flex w-1/2 bg-bg border-l border-border relative overflow-hidden flex-col justify-center p-12 lg:p-20">
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 max-w-lg mx-auto w-full"
        >
          <h2 className="text-4xl font-display font-black mb-6 text-text">Welcome to Penta</h2>
          <p className="text-muted mb-12 text-lg leading-relaxed">
            A unified ecosystem where global learning, competitive coding, and professional growth converge. Follow the steps below to initialize your journey.
          </p>

          <div className="space-y-8 mb-12">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h4 className="text-text font-bold mb-1">Select Your Path</h4>
                <p className="text-sm text-muted">Choose between Student, Teacher, Personal, or Admin roles to tailor your experience.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h4 className="text-text font-bold mb-1">Authenticate Securely</h4>
                <p className="text-sm text-muted">Use your email or connect instantly with GitHub or Google for seamless access.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h4 className="text-text font-bold mb-1">Enter a Dimension</h4>
                <p className="text-sm text-muted">Once authenticated, select your destination dimension to begin your journey.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
