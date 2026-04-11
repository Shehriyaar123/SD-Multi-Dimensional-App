import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Code, 
  FileText, 
  Briefcase, 
  Library, 
  ArrowRight, 
  Globe, 
  Cpu, 
  ShieldCheck, 
  Zap,
  Users,
  Trophy,
  Layers,
  Sparkles,
  CheckCircle2,
  Star,
  Quote,
  ChevronRight,
  Activity,
  Globe2,
  BrainCircuit,
  Lock,
  BarChart3,
  X,
  Sun,
  Moon
} from "lucide-react";
import { useRef, useState, useEffect, ReactNode, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";

// --- ENHANCED DATA WITH RICH PARAGRAPHS ---
const dimensions = [
  {
    id: 1,
    title: "Global Study Platform",
    headline: "Learn without Borders",
    description: "A borderless learning ecosystem connecting mentors and peers globally with AI-driven personalization.",
    fullDescription: "Dive into a learning environment that adapts to you. Our platform leverages advanced neural networks to match you with peers and mentors who complement your cognitive style, ensuring every session is productive. Whether you're upskilling for a new career or diving deep into academic research, the Global Study Platform provides the tools, community, and global perspective to accelerate your journey. We've dismantled geographical barriers to create a truly universal classroom.",
    icon: Globe,
    color: "from-blue-600 to-cyan-400",
    accent: "#3b82f6",
    details: ["Global Peer Interaction", "AI-Curated Learning Paths", "Real-time Skill Gap Analysis"],
    stat: "500K+ Learners",
    status: "System Optimized",
    uptime: "99.98%",
    metrics: [
      { label: "Mentors", value: "12.4K" },
      { label: "Modules", value: "85K+" },
      { label: "Success", value: "78%" },
      { label: "Active", value: "42K" }
    ],
    features: [
      { title: "Neural Peer Matching", desc: "Connect based on cognitive compatibility." },
      { title: "Dynamic Curriculum", desc: "Real-time adjustment to market trends." },
      { title: "Translation Layers", desc: "Cross-border mentorship without language barriers." }
    ],
    technical: "Distributed P2P | Neural Engine | Vector DB"
  },
  {
    id: 2,
    title: "Elite Coding Arena",
    headline: "Code. Compete. Conquer.",
    description: "High-stakes coding battles and industry-standard project simulations with real-time feedback.",
    fullDescription: "Sharpen your skills in the ultimate gladiatorial arena for developers. This isn't just about solving problems; it's about simulating the high-pressure environments of top tech firms. With support for over 24 languages and an AI judge that reviews not just your output but your code quality and architecture, the Arena ensures you're not just employable—you're exceptional. Battle head-to-head, collaborate in real-time pair programming sessions, and build a portfolio that speaks volumes.",
    icon: Code,
    color: "from-purple-600 to-pink-500",
    accent: "#9333ea",
    details: ["Competitive Hackathons", "Live Pair Programming", "Industry Project Simulations"],
    stat: "10M+ Lines Written",
    status: "Low Latency",
    uptime: "99.99%",
    metrics: [
      { label: "Battles", value: "45K" },
      { label: "Languages", value: "24+" },
      { label: "Solve Rate", value: "14m" },
      { label: "Quality", value: "A+" }
    ],
    features: [
      { title: "Sandboxed Runtimes", desc: "Secure execution for every language." },
      { title: "WebSocket Sync", desc: "Zero-lag pair programming." },
      { title: "AI Code Review", desc: "Semantic bug detection instantly." }
    ],
    technical: "Sandbox Runtime | WebSocket Sync | LLM Analysis"
  },
  {
    id: 3,
    title: "Resume Architect",
    headline: "Your Story, Optimized.",
    description: "AI-driven career narrative transformation optimized for impact and ATS visibility.",
    fullDescription: "Transform your professional narrative with the power of advanced NLP. The Resume Architect doesn't just format your history; it analyzes job descriptions, identifies semantic keywords, and reconstructs your experience to maximize impact. Navigate the black box of Applicant Tracking Systems (ATS) with confidence. With dynamic portfolio integration and one-click tailoring, you'll never send a generic application again. Make every word count towards your next big opportunity.",
    icon: FileText,
    color: "from-orange-600 to-red-500",
    accent: "#ea580c",
    details: ["ATS Optimization AI", "Dynamic Portfolio Builder", "Industry-Specific Templates"],
    stat: "98% Success Rate",
    status: "AI Active",
    uptime: "100%",
    metrics: [
      { label: "Resumes", value: "1.2M" },
      { label: "ATS Pass", value: "94%" },
      { label: "Interviews", value: "+45%" },
      { label: "Templates", value: "150+" }
    ],
    features: [
      { title: "Semantic Extraction", desc: "Identifies hidden skills in your history." },
      { title: "Dynamic Generation", desc: "Interactive web-view mirrors for recruiters." },
      { title: "Real-time Scoring", desc: "ATS scoring against global job boards." }
    ],
    technical: "NLP Analysis | Dynamic PDF | Vector Embeddings"
  },
  {
    id: 4,
    title: "Verified Job Network",
    headline: "Trust in Recruitment.",
    description: "The gold standard of recruitment with manual verification for every company and post.",
    fullDescription: "Enter a job market where trust is the currency, not a gamble. In an era of scams and ghost jobs, the Verified Job Network stands as the beacon of integrity. Every company undergoes rigorous KYC verification, and every salary benchmark is backed by real, blockchain-verified data. We connect talent directly with decision-makers, bypassing the noise of traditional recruiting. It’s not just about finding a job; it’s about finding the *right* role, transparently.",
    icon: Briefcase,
    color: "from-emerald-600 to-teal-500",
    accent: "#10b981",
    details: ["KYC Verified Companies", "Direct Talent Sourcing", "Transparent Hiring Pipeline"],
    stat: "12K+ Verified Firms",
    status: "KYC Verified",
    uptime: "99.95%",
    metrics: [
      { label: "Placed", value: "240K" },
      { label: "Avg Salary", value: "$95K" },
      { label: "Hire Speed", value: "12d" },
      { label: "Retention", value: "92%" }
    ],
    features: [
      { title: "Blockchain Credentials", desc: "Verified candidate history." },
      { title: "Zero-Knowledge Proofs", desc: "Company financials verified privately." },
      { title: "Direct-to-CTO", desc: "Chat directly with leadership." }
    ],
    technical: "Blockchain | Zero-Knowledge | Secure Messaging"
  },
  {
    id: 5,
    title: "Digital Knowledge Library",
    headline: "The World's Mind.",
    description: "The world's knowledge indexed by intent with natural language query support.",
    fullDescription: "Forget keyword matching; ask questions as if you were speaking to a human. The Digital Knowledge Library indexes the world's research, tutorials, and documentation using vector embeddings, allowing for semantic search that understands *intent*. Synthesize information from thousands of sources instantly, visualize complex concepts in 3D, and access the world's repository of truth with zero friction. It is the ultimate research assistant, available 24/7.",
    icon: Library,
    color: "from-indigo-600 to-violet-500",
    accent: "#6366f1",
    details: ["Semantic Search Engine", "Interactive 3D Modules", "Research Paper Repository"],
    stat: "2M+ Resources",
    status: "Indexing Live",
    uptime: "99.99%",
    metrics: [
      { label: "Queries", value: "5M/D" },
      { label: "Papers", value: "1.4M" },
      { label: "Accuracy", value: "96%" },
      { label: "Latency", value: "120ms" }
    ],
    features: [
      { title: "Vector Indexing", desc: "Sub-second semantic retrieval." },
      { title: "LLM Synthesis", desc: "Combine multiple sources instantly." },
      { title: "3D Visualization", desc: "Interactive scientific concepts." }
    ],
    technical: "Vector DB | LLM Synthesis | WebGL Rendering"
  }
];

const stats = [
  { label: "Active Users", value: "1.2M+", icon: Users },
  { label: "Countries", value: "180+", icon: Globe },
  { label: "Success Stories", value: "50K+", icon: Trophy },
  { label: "AI Queries/Day", value: "5M+", icon: Zap }
];

const steps = [
  { title: "Initialize", desc: "Create your unified profile across all 5 dimensions.", icon: Sparkles },
  { title: "Master", desc: "Learn, code, and build with AI-enhanced tools.", icon: Layers },
  { title: "Verify", desc: "Get your skills and profile verified by our ecosystem.", icon: ShieldCheck },
  { title: "Accelerate", desc: "Connect with verified recruiters and land your dream role.", icon: Briefcase }
];

const testimonials = [
  { name: "Sarah Chen", role: "Software Engineer at Google", text: "Penta-App's coding arena and resume builder were instrumental in my career transition. The AI feedback is scarily accurate.", avatar: "https://picsum.photos/seed/sarah/100/100" },
  { name: "Marcus Thorne", role: "Data Scientist", text: "The knowledge library's semantic search is a game-changer for research. I found papers in minutes that used to take hours.", avatar: "https://picsum.photos/seed/marcus/100/100" },
  { name: "Elena Rodriguez", role: "Global Learner", text: "Connecting with mentors from across the globe through the study platform has given me a perspective I couldn't get anywhere else.", avatar: "https://picsum.photos/seed/elena/100/100" }
];

// --- COMPONENTS ---

function FloatingElement({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeDimension, setActiveDimension] = useState(0);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const { theme, setTheme } = useSettings();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Mouse tracking for global glow
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll logic for Progress Bar
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} className="relative bg-bg text-text min-h-screen overflow-x-hidden selection:bg-blue-500/30 transition-colors duration-300">
      
      {/* CSS for Smooth Scroll Snap & Noise */}
      <style>{`
        html { scroll-behavior: smooth; }
        .snap-section { scroll-snap-align: start; scroll-snap-stop: always; }
        .noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E"); }
        .mask-gradient { mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent); }
      `}</style>

      {/* Scroll Progress Bar */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left z-[100]" />

      {/* Dynamic Cursor Glow */}
      <motion.div 
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-0 opacity-30 blur-[120px] transition-colors duration-500"
        animate={{ x: mousePos.x - 300, y: mousePos.y - 300 }}
        transition={{ type: "spring", damping: 20, stiffness: 50 }}
        style={{ background: dimensions[activeDimension]?.accent || "#3b82f6" }}
      />

      {/* Static Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-blue-900/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-purple-900/20 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <motion.div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-text text-bg rounded-lg flex items-center justify-center font-display font-bold text-lg shadow-lg shadow-text/10 group-hover:rounded-xl transition-all duration-300">P</div>
          <span className="font-display font-bold text-xl tracking-tight">PENTA</span>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2.5 bg-surface text-text rounded-full border border-border hover:border-text/30 backdrop-blur-md transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>

          <Link to="/login">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-surface text-text rounded-full text-xs font-bold border border-border hover:border-text/30 backdrop-blur-md transition-colors"
            >
              Launch App
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* --- SECTION 1: HERO --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 z-10 snap-section">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-muted text-xs font-medium mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Now in Public Beta
          </div>
          
          <h1 className="text-6xl sm:text-8xl font-display font-bold tracking-tighter leading-[0.9] mb-8">
            REDEFINE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">POSSIBILITY</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            A unified ecosystem where global learning, competitive coding, and professional growth converge into a single, AI-driven experience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(var(--text-rgb),0.2)" }}
                className="px-8 py-4 bg-text text-bg font-bold rounded-full hover:shadow-lg transition-all flex items-center gap-3 group"
              >
                Enter the Ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <button 
              onClick={() => setIsDocOpen(true)}
              className="text-muted hover:text-text font-medium transition-all flex items-center gap-3 group"
            >
              View Documentation <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-16 flex flex-col items-center gap-4 text-muted"
        >
          <span className="text-xs uppercase tracking-widest">Scroll to Explore</span>
          <div className="w-px h-12 bg-gradient-to-b from-text/20 to-transparent" />
        </motion.div>
      </section>

      {/* --- SECTION 2: STATS --- */}
      <section className="relative z-10 py-20 border-t border-b border-border bg-surface/20 backdrop-blur-lg snap-section">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="text-center"
            >
              <stat.icon className="w-6 h-6 mx-auto mb-4 text-muted" />
              <div className="text-4xl md:text-5xl font-display font-black mb-2 tracking-tighter">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- SECTION 3: DIMENSIONS (Enhanced) --- */}
      <section className="relative z-10 py-20 px-4 md:px-6 max-w-7xl mx-auto snap-section">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false }}
            className="text-blue-500 font-bold text-sm uppercase tracking-[0.3em] mb-4"
          >
            Core Architecture
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter">Five Dimensions.</h2>
          <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-muted">One Ecosystem.</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dimensions.map((dim, idx) => (
            <motion.div
              key={dim.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              onHoverStart={() => setActiveDimension(idx)}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative bg-surface/40 border border-border hover:border-text/30 transition-all duration-500 rounded-3xl overflow-hidden ${idx === 0 ? 'lg:col-span-2' : ''}`}
            >
              {/* Top Gradient Line */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${dim.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="p-8 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${dim.color} flex items-center justify-center shadow-lg`} style={{ boxShadow: `0 10px 30px -10px ${dim.accent}` }}>
                      <dim.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${dim.color} bg-clip-text text-transparent`}>{dim.headline}</p>
                      <h3 className="text-xl font-display font-black tracking-tight">{dim.title}</h3>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-muted font-bold">0{dim.id}</div>
                </div>
                
                {/* Rich Description Paragraph */}
                <p className="text-muted text-sm leading-relaxed mb-8 flex-grow">
                  {dim.fullDescription}
                </p>

                {/* Feature Grid (Instead of simple list) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {dim.features.map((f, i) => (
                    <div key={i} className="bg-bg/30 rounded-xl p-4 border border-border group-hover:border-text/10 transition-colors">
                      <h4 className="font-bold text-text text-sm mb-1">{f.title}</h4>
                      <p className="text-muted text-xs">{f.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Footer Stats */}
                <div className="flex justify-between items-end border-t border-border pt-6">
                  <div className="flex gap-6">
                    {dim.metrics.slice(0, 2).map((m, i) => (
                      <div key={i}>
                        <div className="text-xl font-display font-black text-text">{m.value}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted">{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted bg-surface/50 px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {dim.status}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- SECTION 4: BENTO FEATURES --- */}
      <section className="relative z-10 py-20 px-4 md:px-6 max-w-7xl mx-auto snap-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Large Card - Global Connectivity */}
          <motion.div 
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.95 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8 }}
            className="md:col-span-2 p-10 rounded-3xl bg-gradient-to-br from-surface to-surface/50 border border-border flex flex-col justify-between relative overflow-hidden group min-h-[400px]"
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,_rgba(59,130,246,0.3),_transparent_70%)] group-hover:opacity-30 transition-opacity" />
            <div>
              <Globe2 className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-3xl font-display font-black mb-3">Global Connectivity</h3>
              <p className="text-muted max-w-md leading-relaxed">Our network spans 180+ countries, connecting you with the brightest minds and most innovative firms globally.</p>
            </div>
            <div className="flex gap-4 mt-8">
               <div className="h-1 w-16 bg-blue-500 rounded-full" />
               <div className="h-1 w-8 bg-border rounded-full" />
            </div>
          </motion.div>

          {/* Small Card - Security */}
          <motion.div 
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-10 rounded-3xl bg-gradient-to-br from-surface to-surface/50 border border-border flex flex-col justify-between min-h-[400px] group"
          >
            <ShieldCheck className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="text-2xl font-display font-black mb-2">Admin Verified</h3>
              <p className="text-muted text-sm leading-relaxed">Every recruiter and firm is manually verified by our elite admin team to ensure 100% trust.</p>
            </div>
          </motion.div>

          {/* Small Card - AI Intelligence */}
          <motion.div 
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="p-10 rounded-3xl bg-gradient-to-br from-surface to-surface/50 border border-border flex flex-col justify-between min-h-[400px] group"
          >
            <BrainCircuit className="w-10 h-10 text-purple-500 group-hover:rotate-12 transition-transform" />
            <div>
              <h3 className="text-2xl font-display font-black mb-2">AI-First Intelligence</h3>
              <p className="text-muted text-sm leading-relaxed">Powered by Gemini AI, our platform understands your goals and adapts in real-time.</p>
            </div>
          </motion.div>

          {/* Large Card - Velocity */}
          <motion.div 
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.95 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="md:col-span-2 p-10 rounded-3xl bg-gradient-to-br from-surface to-surface/50 border border-border flex flex-col justify-between relative overflow-hidden group min-h-[400px]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors" />
             <div>
              <Activity className="w-10 h-10 text-orange-500 mb-6" />
              <h3 className="text-3xl font-display font-black mb-3">Instant Synergy</h3>
              <p className="text-muted max-w-md leading-relaxed">Seamlessly transition between learning, coding, and applying without ever leaving the ecosystem.</p>
            </div>
            <div className="flex items-center gap-4 mt-8 text-orange-500 text-sm font-medium group-hover:gap-6 transition-all">
              View Performance Metrics <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- SECTION 5: PROCESS --- */}
      <section className="relative z-10 py-24 snap-section bg-surface/10 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-display font-black mb-4 tracking-tighter">The Penta Journey</h2>
            <p className="text-muted max-w-md mx-auto">A streamlined path from curiosity to career mastery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-14 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent z-0" />
            
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative z-10 text-center group"
              >
                <div className="relative w-28 h-28 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-6 group-hover:border-blue-500/50 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] transition-all duration-500">
                  <step.icon className="w-10 h-10 text-muted group-hover:text-blue-400 transition-colors" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center border-4 border-bg">0{i+1}</div>
                </div>
                <h4 className="text-xl font-display font-bold mb-2">{step.title}</h4>
                <p className="text-muted text-sm leading-relaxed px-2">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 6: TESTIMONIALS --- */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto snap-section">
        <div className="mb-20 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-black mb-4 tracking-tighter">Voices of the Ecosystem</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-surface/50 border border-border hover:border-text/20 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-border" referrerPolicy="no-referrer" />
                <div>
                  <h5 className="font-bold">{t.name}</h5>
                  <p className="text-muted text-xs">{t.role}</p>
                </div>
              </div>
              <p className="text-muted text-sm leading-relaxed italic">"{t.text}"</p>
              <div className="mt-6 flex gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />)}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- SECTION 7: CTA --- */}
      <section className="relative z-10 py-24 px-6 snap-section">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          className="max-w-5xl mx-auto p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-7xl font-display font-black text-white mb-6 tracking-tighter leading-[0.9]">Ready to <br /> Evolve?</h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-10">
              Join thousands of professionals and students who are already shaping their future.
            </p>
            <Link to="/login" state={{ isSignup: true }}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-white text-blue-600 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-shadow"
              >
                Create Account
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-border px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-text text-bg rounded-lg flex items-center justify-center font-bold">P</div>
            <span className="font-display font-bold text-lg">PENTA</span>
          </div>
          <div className="flex gap-8 text-xs text-muted">
            <a href="#" className="hover:text-text transition-colors">Privacy</a>
            <a href="#" className="hover:text-text transition-colors">Terms</a>
            <a href="#" className="hover:text-text transition-colors">Security</a>
          </div>
          <div className="text-xs text-muted">© 2025 PENTA</div>
        </div>
      </footer>
      {/* Documentation Modal */}
      <AnimatePresence>
        {isDocOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={() => setIsDocOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-bg border border-border rounded-3xl w-full max-w-4xl max-h-full overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-border bg-surface/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-text text-bg rounded-lg flex items-center justify-center font-bold text-sm">P</div>
                  <h3 className="text-xl font-display font-bold text-text">Penta Documentation</h3>
                </div>
                <button 
                  onClick={() => setIsDocOpen(false)}
                  className="p-2 text-muted hover:text-text hover:bg-surface rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar">
                <div className="prose prose-invert max-w-none">
                  <h2 className="text-3xl font-display font-bold mb-6 text-text">Welcome to the 5th Dimension</h2>
                  <p className="text-muted leading-relaxed mb-8">
                    Penta is a unified ecosystem where global learning, competitive coding, and professional growth converge into a single, AI-driven experience. This documentation outlines the core architecture and how to integrate with our modules.
                  </p>

                  <div className="space-y-12 mb-12">
                    {/* Dimension 1 */}
                    <div className="bg-surface/30 p-8 rounded-3xl border border-border">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                          <Globe className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-display font-bold text-text m-0">Dimension 1: Global Study Platform</h4>
                          <p className="text-blue-400 text-sm font-mono mt-1">@penta/study-core</p>
                        </div>
                      </div>
                      <div className="space-y-4 text-muted text-sm leading-relaxed">
                        <p>
                          The Global Study Platform is the foundation of the Penta ecosystem. It utilizes a proprietary Neural-link peer matching algorithm to connect learners across the globe based on skill level, learning pace, and timezone compatibility.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-muted">
                          <li><strong className="text-text">WebRTC Integration:</strong> Sub-50ms latency for real-time audio/video collaboration and shared whiteboarding.</li>
                          <li><strong className="text-text">Dynamic Curriculum API:</strong> AI-generated learning paths that adapt in real-time based on assessment scores and peer feedback.</li>
                          <li><strong className="text-text">Translation Layer:</strong> Real-time NLP translation supporting 40+ languages to eliminate geographical learning barriers.</li>
                        </ul>
                        <div className="bg-bg/50 rounded-xl p-4 border border-border font-mono text-xs text-muted mt-4">
                          <span className="text-purple-400">await</span> client.study.matchPeer({`{`} <br/>
                          &nbsp;&nbsp;topic: <span className="text-green-400">'System Design'</span>,<br/>
                          &nbsp;&nbsp;level: <span className="text-green-400">'Advanced'</span>,<br/>
                          &nbsp;&nbsp;latencyPreference: <span className="text-orange-400">50</span><br/>
                          {`}`});
                        </div>
                      </div>
                    </div>

                    {/* Dimension 2 */}
                    <div className="bg-surface/30 p-8 rounded-3xl border border-border">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                          <Code className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-display font-bold text-text m-0">Dimension 2: Elite Coding Arena</h4>
                          <p className="text-purple-400 text-sm font-mono mt-1">@penta/arena-engine</p>
                        </div>
                      </div>
                      <div className="space-y-4 text-muted text-sm leading-relaxed">
                        <p>
                          A high-performance, sandboxed execution environment designed for competitive programming, technical interviews, and algorithmic battles.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-muted">
                          <li><strong className="text-text">Isolated Runtimes:</strong> Secure Docker-based execution supporting 24+ languages with strict memory and CPU constraints.</li>
                          <li><strong className="text-text">WebSocket Sync:</strong> Operational Transformation (OT) based real-time code synchronization for pair programming.</li>
                          <li><strong className="text-text">Elo Rating System:</strong> Advanced matchmaking and global leaderboards updated in real-time using a modified Glicko-2 rating system.</li>
                        </ul>
                        <div className="bg-bg/50 rounded-xl p-4 border border-border font-mono text-xs text-muted mt-4">
                          <span className="text-purple-400">const</span> session = <span className="text-purple-400">await</span> client.arena.createBattle({`{`} <br/>
                          &nbsp;&nbsp;mode: <span className="text-green-400">'1v1'</span>,<br/>
                          &nbsp;&nbsp;difficulty: <span className="text-green-400">'Hard'</span>,<br/>
                          &nbsp;&nbsp;languageRestrictions: [<span className="text-green-400">'Rust'</span>, <span className="text-green-400">'Go'</span>, <span className="text-green-400">'C++'</span>]<br/>
                          {`}`});
                        </div>
                      </div>
                    </div>

                    {/* Dimension 3 */}
                    <div className="bg-surface/30 p-8 rounded-3xl border border-border">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                          <FileText className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-display font-bold text-text m-0">Dimension 3: Resume Architect</h4>
                          <p className="text-orange-400 text-sm font-mono mt-1">@penta/resume-ai</p>
                        </div>
                      </div>
                      <div className="space-y-4 text-muted text-sm leading-relaxed">
                        <p>
                          An intelligent profile builder that translates your activity across the Penta ecosystem into a verifiable, ATS-optimized professional portfolio.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-muted">
                          <li><strong className="text-text">Semantic Extraction:</strong> NLP engine that parses GitHub repositories, LinkedIn profiles, and Penta Arena statistics to auto-generate bullet points.</li>
                          <li><strong className="text-text">ATS Optimization:</strong> Real-time scoring against 5,000+ global job descriptions to ensure maximum keyword match rates.</li>
                          <li><strong className="text-text">Dynamic Templates:</strong> Export to PDF, JSON Resume, or host as a dynamic web portfolio with verified skill badges.</li>
                        </ul>
                        <div className="bg-bg/50 rounded-xl p-4 border border-border font-mono text-xs text-muted mt-4">
                          <span className="text-purple-400">const</span> resume = <span className="text-purple-400">await</span> client.resume.generate({`{`} <br/>
                          &nbsp;&nbsp;targetRole: <span className="text-green-400">'Senior Frontend Engineer'</span>,<br/>
                          &nbsp;&nbsp;includePentaStats: <span className="text-orange-400">true</span>,<br/>
                          &nbsp;&nbsp;format: <span className="text-green-400">'ATS_STRICT'</span><br/>
                          {`}`});
                        </div>
                      </div>
                    </div>

                    {/* Dimension 4 */}
                    <div className="bg-surface/30 p-8 rounded-3xl border border-border">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                          <Briefcase className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-display font-bold text-text m-0">Dimension 4: Verified Job Network</h4>
                          <p className="text-emerald-400 text-sm font-mono mt-1">@penta/talent-graph</p>
                        </div>
                      </div>
                      <div className="space-y-4 text-muted text-sm leading-relaxed">
                        <p>
                          A decentralized, trustless hiring network connecting verified talent directly with vetted companies, eliminating traditional recruitment friction.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-muted">
                          <li><strong className="text-text">KYC Verification:</strong> All participating companies undergo strict verification to prevent ghost jobs and scams.</li>
                          <li><strong className="text-text">Smart Contracts:</strong> Escrow-backed technical bounties and interview compensation mechanisms.</li>
                          <li><strong className="text-text">Zero-Knowledge Proofs:</strong> Verify salary benchmarks and candidate expectations without revealing exact current compensation.</li>
                        </ul>
                        <div className="bg-bg/50 rounded-xl p-4 border border-border font-mono text-xs text-muted mt-4">
                          <span className="text-purple-400">const</span> matches = <span className="text-purple-400">await</span> client.jobs.findMatches({`{`} <br/>
                          &nbsp;&nbsp;minMatchScore: <span className="text-orange-400">0.85</span>,<br/>
                          &nbsp;&nbsp;requireVerifiedSalary: <span className="text-orange-400">true</span><br/>
                          {`}`});
                        </div>
                      </div>
                    </div>

                    {/* Dimension 5 */}
                    <div className="bg-surface/30 p-8 rounded-3xl border border-border relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                          <Library className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-display font-bold text-text m-0">Dimension 5: Digital Knowledge Library</h4>
                          <p className="text-indigo-400 text-sm font-mono mt-1">@penta/knowledge-graph</p>
                        </div>
                      </div>
                      <div className="space-y-4 text-muted text-sm leading-relaxed relative z-10">
                        <p>
                          The Digital Knowledge Library indexes the world's research, tutorials, and documentation using advanced vector embeddings, allowing for semantic search that understands intent rather than just keywords.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-muted">
                          <li><strong className="text-text">Semantic Search Engine:</strong> Query millions of documents using natural language with sub-second retrieval times backed by Pinecone/Milvus.</li>
                          <li><strong className="text-text">Interactive 3D Modules:</strong> WebGL-powered visualizations for complex scientific and engineering concepts.</li>
                          <li><strong className="text-text">LLM Synthesis:</strong> Automatically synthesize answers from multiple verified sources with inline citations.</li>
                        </ul>
                        <div className="bg-bg/50 rounded-xl p-4 border border-border font-mono text-xs text-muted mt-4">
                          <span className="text-purple-400">const</span> results = <span className="text-purple-400">await</span> client.library.semanticSearch({`{`} <br/>
                          &nbsp;&nbsp;query: <span className="text-green-400">'How does Raft consensus work?'</span>,<br/>
                          &nbsp;&nbsp;synthesizeAnswer: <span className="text-orange-400">true</span>,<br/>
                          &nbsp;&nbsp;includeVisualizations: <span className="text-orange-400">true</span><br/>
                          {`}`});
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-display font-bold mb-4 text-text">Quick Start Guide</h3>
                  <div className="bg-surface/50 rounded-xl p-4 border border-border mb-8 font-mono text-sm text-text">
                    <div className="text-muted mb-2"># Initialize the Penta SDK</div>
                    <div className="text-blue-400">npm install</div> <div className="inline">@penta/sdk</div>
                    <br/><br/>
                    <div className="text-muted mb-2"># Authenticate your client</div>
                    <div className="text-purple-400">import</div> <div className="inline">{`{ PentaClient }`}</div> <div className="text-purple-400">from</div> <div className="text-green-400">'@penta/sdk'</div>;
                    <br/>
                    <div className="text-purple-400">const</div> <div className="inline">client = </div><div className="text-purple-400">new</div> <div className="inline">PentaClient(</div><div className="text-green-400">'YOUR_API_KEY'</div><div className="inline">);</div>
                  </div>

                  <p className="text-muted text-sm italic">
                    Note: This is a preview environment. Full API documentation and SDKs will be available upon public release.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}