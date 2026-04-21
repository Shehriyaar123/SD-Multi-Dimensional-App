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
  Moon,
  MousePointer2,
  ExternalLink,
  ArrowUpRight,
  Volume2,
  VolumeX,
  Play,
  Pause
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
    fullDescription: "Dive into a learning environment that adapts to you. Our platform leverages advanced neural networks to match you with peers and mentors who complement your cognitive style, ensuring every session is productive.",
    icon: Globe,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000",
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
    fullDescription: "Sharpen your skills in the ultimate gladiatorial arena for developers. Simulate high-pressure environments of top tech firms with support for over 24 languages and AI-driven code quality analysis.",
    icon: Code,
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000",
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
    fullDescription: "Transform your professional narrative with the power of advanced NLP. Analyze job descriptions, identify semantic keywords, and reconstruct your experience to maximize impact.",
    icon: FileText,
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=1000",
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
    fullDescription: "Enter a job market where trust is the currency. Every company undergoes rigorous KYC verification, and every salary benchmark is backed by real, blockchain-verified data.",
    icon: Briefcase,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000",
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
    title: "Knowledge Library",
    headline: "The World's Mind.",
    description: "The world's knowledge indexed by intent with natural language query support.",
    fullDescription: "Ask questions as if you were speaking to a human. Our library indexes research, tutorials, and documentation using vector embeddings for semantic search that understands intent.",
    icon: Library,
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1000",
    color: "from-indigo-600 to-violet-500",
    accent: "#6366f1",
    details: ["Semantic Search Engine", "3D Concept Visualization", "Multi-Source Information Synthesis"],
    stat: "2B+ Data Points",
    status: "Indexing Live",
    uptime: "99.99%",
    metrics: [
      { label: "Resources", value: "5M+" },
      { label: "Queries/sec", value: "1.2K" },
      { label: "Accuracy", value: "99.2%" },
      { label: "Sources", value: "15K" }
    ],
    features: [
      { title: "Intent Analysis", desc: "Understands the 'why' behind your search." },
      { title: "Knowledge Graphs", desc: "Visualizes connections between topics." },
      { title: "Auto-Summarization", desc: "Get the gist of long papers instantly." }
    ],
    technical: "Vector Search | Knowledge Graph | LLM Summarization"
  },
  {
    id: 6,
    title: "AI Innovation Lab",
    headline: "Build the Future.",
    description: "A sandbox for deploying and testing custom AI models with distributed GPU compute.",
    fullDescription: "Unleash the power of frontier models. Our Innovation Lab provides a high-performance sandbox for training, fine-tuning, and deploying custom AI solutions with zero infrastructure overhead.",
    icon: BrainCircuit,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000",
    color: "from-red-600 to-orange-500",
    accent: "#ef4444",
    details: ["Distributed GPU Compute", "Model Fine-tuning Suite", "Real-time Inference API"],
    stat: "500+ Models Deployed",
    status: "Compute Ready",
    uptime: "99.97%",
    metrics: [
      { label: "Compute", value: "12.5 PFLOPS" },
      { label: "Models", value: "500+" },
      { label: "Latency", value: "45ms" },
      { label: "Uptime", value: "99.9%" }
    ],
    features: [
      { title: "Auto-Scaling", desc: "Compute that grows with your model." },
      { title: "Dataset Curation", desc: "AI-assisted data cleaning and labeling." },
      { title: "One-Click Deploy", desc: "Go from notebook to API in seconds." }
    ],
    technical: "CUDA | Distributed Training | Serverless GPU"
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

function TiltCard({ children, className }: { children: ReactNode, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      <div style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
}

// --- CUSTOM HOOKS ---
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

function VideoScrub({ scrollYProgress, isPaused, isMuted }: { scrollYProgress: any, isPaused: boolean, isMuted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { width } = useWindowSize();
  const isMobile = width < 1024;

  // Map scroll progress to video time
  // We'll use the first 20% of the total scroll for the video scrubbing
  const videoTime = useTransform(scrollYProgress, [0, 0.2], [0, 5]); // Assuming a 5s loopable video

  useEffect(() => {
    if (isPaused) return;

    const unsubscribe = videoTime.on("change", (latest) => {
      if (videoRef.current) {
        // Use requestAnimationFrame for smoother scrubbing
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = latest;
          }
        });
      }
    });
    return () => unsubscribe();
  }, [videoTime, isPaused]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <video
        ref={videoRef}
        src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-1664-large.mp4"
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover opacity-30 grayscale transition-opacity duration-1000"
        style={{ opacity: isPaused ? 0.1 : 0.3 }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
    </div>
  );
}

function DimensionScene({ 
  dimension, 
  index
}: { 
  dimension: typeof dimensions[0], 
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();
  const isMobile = width < 1024;
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Local progress for the "active" part of the section (when it's in the middle)
  const { scrollYProgress: activeProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"]
  });

  const progress = useSpring(activeProgress, { stiffness: 50, damping: 20 });
  
  // Extreme 3D Camera/Object Transformations (Entrance Only)
  const rotateY = useTransform(progress, [0, 0.5], [isMobile ? -45 : -90, 0]);
  const rotateX = useTransform(progress, [0, 0.5], [isMobile ? 15 : 30, 0]);
  const z = useTransform(progress, [0, 0.5], [-1000, 0]);
  const opacity = useTransform(progress, [0, 0.2], [0, 1]);
  const scale = useTransform(progress, [0, 0.5], [0.8, 1]);

  // "Transformer" assembly parts (Entrance Only)
  const borderOffset = useTransform(progress, [0, 0.4], [300, 0]);
  const iconScale = useTransform(progress, [0.3, 0.45, 0.5], [0, 1.2, 1]);
  const textFlyIn = useTransform(progress, [0, 0.5], [isMobile ? 50 : 200, 0]);

  return (
    <section ref={ref} id={`dimension-${index}`} className="relative min-h-[200vh] w-full">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ opacity, z, scale, rotateY, rotateX, transformStyle: "preserve-3d" }}
          className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center px-6 pointer-events-none"
        >
          {/* 3D Visual Side */}
          <div className="relative flex justify-center items-center perspective-[2000px] transform-style-3d">
            <motion.div 
              style={{ scale: useTransform(progress, [0.4, 0.5], [0.8, 1]) }}
              className={`absolute -inset-20 bg-gradient-to-br ${dimension.color} opacity-20 blur-[120px] rounded-full`} 
            />
            
            <TiltCard className="relative w-full max-w-[320px] lg:max-w-none aspect-[16/10] rounded-[32px] lg:rounded-[40px] overflow-hidden border border-white/10 shadow-2xl pointer-events-auto">
              <motion.img 
                src={dimension.image} 
                alt={dimension.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                style={{ transform: "translateZ(30px) scale(1.1)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <motion.div 
                style={{ x: borderOffset, transform: "translateZ(100px)" }}
                className="absolute top-6 right-6 lg:top-8 lg:right-8 w-16 h-16 lg:w-24 lg:h-24 border-t-2 border-r-2 border-white/40 rounded-tr-2xl lg:rounded-tr-3xl"
              />
              <motion.div 
                style={{ x: useTransform(progress, [0, 0.5], [-300, 0]), transform: "translateZ(100px)" }}
                className="absolute bottom-6 left-6 lg:bottom-8 lg:left-8 w-16 h-16 lg:w-24 lg:h-24 border-b-2 border-l-2 border-white/40 rounded-bl-2xl lg:rounded-bl-3xl"
              />

              <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10" style={{ transform: "translateZ(150px)" }}>
                <motion.div 
                  style={{ scale: iconScale }}
                  className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center mb-4 lg:mb-6"
                >
                  <dimension.icon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </motion.div>
                <h3 className="text-3xl lg:text-6xl font-display font-black tracking-tighter text-white leading-none">{dimension.title}</h3>
              </div>
            </TiltCard>
          </div>

          {/* Content Side */}
          <motion.div 
            style={{ x: textFlyIn, transform: "translateZ(200px)" }}
            className="space-y-6 lg:space-y-10 text-center lg:text-left pointer-events-auto"
          >
            <div className="space-y-4 lg:space-y-6">
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="h-px w-8 lg:w-12 bg-white/40" />
                <span className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.5em] text-white/60">Dimension 0{dimension.id}</span>
              </div>
              <h2 className="text-4xl lg:text-8xl font-display font-black tracking-tighter leading-[0.85] text-white">
                {dimension.headline.split(' ').map((word, i) => (
                  <motion.span 
                    key={i} 
                    className="inline-block mr-3 lg:mr-4"
                    style={{ 
                      y: useTransform(progress, [0.3 + (i * 0.05), 0.5], [30, 0]),
                      opacity: useTransform(progress, [0.3 + (i * 0.05), 0.5], [0, 1])
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h2>
              <p className="text-lg lg:text-3xl text-white/80 leading-tight font-light italic max-w-xl mx-auto lg:mx-0">
                "{dimension.description}"
              </p>
              <p className="text-white/40 leading-relaxed text-xs lg:text-xl max-w-lg mx-auto lg:mx-0 font-light">
                {dimension.fullDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
              {dimension.features.map((f, i) => (
                <motion.div 
                  key={i}
                  style={{ 
                    x: useTransform(progress, [0.4 + (i * 0.1), 0.6], [50, 0]),
                    opacity: useTransform(progress, [0.4 + (i * 0.1), 0.6], [0, 1])
                  }}
                  className="space-y-1 lg:space-y-2 group"
                >
                  <div className="flex items-center justify-center lg:justify-start gap-2 lg:gap-3">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white/60 group-hover:bg-white transition-all group-hover:scale-150" />
                    <h4 className="text-[10px] lg:text-sm font-bold uppercase tracking-widest text-white/90">{f.title}</h4>
                  </div>
                  <p className="text-[8px] lg:text-xs text-white/30 leading-relaxed uppercase tracking-widest pl-4 lg:pl-5">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useWindowSize();
  const isMobile = width < 1024;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  const [isDocOpen, setIsDocOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const { theme, setTheme } = useSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#050505] text-white selection:bg-white/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;700;900&display=swap');
        .font-display { font-family: 'Outfit', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        body { overflow-x: hidden; background: #050505; }
        .transform-style-3d { transform-style: preserve-3d; }
      `}</style>

      {/* --- NAVIGATION --- */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-4 lg:px-8 py-4 lg:py-6 flex justify-between items-center ${scrolled ? 'bg-black/60 backdrop-blur-2xl border-b border-white/5' : ''}`}>
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 lg:w-6 lg:h-6 text-black" />
          </div>
          <span className="text-lg lg:text-xl font-display font-black tracking-tighter uppercase">HexaCore</span>
        </div>
        
        <div className="hidden xl:flex items-center gap-8">
          {dimensions.map((dim, idx) => (
            <button 
              key={dim.id} 
              onClick={() => {
                const element = document.getElementById(`dimension-${idx}`);
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors"
            >
              Dim 0{dim.id}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 lg:px-7 py-2 lg:py-2.5 bg-white text-black text-[9px] lg:text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-white/10"
            >
              Access Portal
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* --- GLOBAL BACKGROUND --- */}
      <div className="fixed inset-0 z-0">
        <VideoScrub scrollYProgress={smoothProgress} isPaused={isVideoPaused} isMuted={isVideoMuted} />
      </div>

      {/* --- SCROLLING CONTENT (LONG PAGE) --- */}
      <div className="relative z-10 perspective-[2000px] transform-style-3d">
        
        {/* Welcome Intro */}
        <section className="h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
          <motion.div 
            style={{ 
              opacity: useTransform(smoothProgress, [0, 0.05], [1, 0]),
              z: useTransform(smoothProgress, [0, 0.05], [0, 500]),
              rotateX: useTransform(smoothProgress, [0, 0.05], [0, 20]),
            }}
            className="space-y-6"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block px-6 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl text-xs font-bold uppercase tracking-[0.5em] text-white/80 mb-8"
            >
              The 6th Dimension
            </motion.div>
            <h1 className="text-6xl md:text-9xl lg:text-[14rem] font-display font-black tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              HEXACORE
            </h1>
            <p className="text-white/40 text-lg lg:text-3xl tracking-[0.6em] uppercase font-bold mt-8">6 Dimensions. 1 Vision.</p>
            
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="pt-20 flex flex-col items-center gap-4"
            >
              <div className="w-px h-24 bg-gradient-to-b from-white/60 to-transparent" />
              <p className="text-white/30 text-xs uppercase tracking-[0.4em] font-bold">Scroll to Explore</p>
            </motion.div>
          </motion.div>
        </section>

        {/* Dimension Overview */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-32 relative">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-9xl font-display font-black tracking-tighter text-white mb-24 text-center"
          >
            THE ECOSYSTEM
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 max-w-6xl w-full">
            {dimensions.map((dim, i) => (
              <motion.div 
                key={dim.id} 
                initial={{ opacity: 0, z: -200, rotateX: 20 }}
                whileInView={{ opacity: 1, z: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col items-center text-center space-y-6 hover:bg-white/10 transition-colors group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${dim.color} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
                  <dim.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{dim.title}</h3>
                <p className="text-xs lg:text-sm text-white/40 leading-relaxed">{dim.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Dimensions Showcase (Vertical Stack) */}
        {dimensions.map((dim, idx) => (
          <DimensionScene 
            key={dim.id} 
            dimension={dim} 
            index={idx} 
          />
        ))}

        {/* Final Scene */}
        <section className="min-h-screen flex items-center justify-center px-6 py-32">
          <div className="max-w-5xl w-full text-center space-y-16">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="text-6xl md:text-9xl lg:text-[12rem] font-display font-black tracking-tighter leading-none text-white"
            >
              ASCEND<br />BEYOND
            </motion.h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 py-12">
              {stats.map((s, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center space-y-2"
                >
                  <div className="text-4xl lg:text-7xl font-display font-black text-white">{s.value}</div>
                  <div className="text-xs uppercase tracking-[0.4em] text-white/40 font-bold">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link to="/login" state={{ isSignup: true }}>
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(255,255,255,0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-16 py-6 bg-white text-black rounded-full text-sm font-black uppercase tracking-[0.3em]"
                >
                  Initialize Account
                </motion.button>
              </Link>
              <button 
                onClick={() => setIsDocOpen(true)}
                className="px-16 py-6 border-2 border-white/10 hover:bg-white/5 rounded-full text-sm font-bold uppercase tracking-[0.3em] transition-all"
              >
                System Docs
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* --- GLOBAL 3D DEBRIS --- */}
      <div className="fixed inset-0 pointer-events-none z-0 perspective-[1000px] transform-style-3d">
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: (Math.random() - 0.5) * 2000, 
              y: (Math.random() - 0.5) * 2000,
              z: Math.random() * -5000,
              rotate: Math.random() * 360
            }}
            style={{
              z: useTransform(smoothProgress, [0, 1], [Math.random() * -5000, 2000]),
              opacity: Math.random() * 0.5,
              scale: Math.random() * 2
            }}
            className="absolute"
          >
            {i % 3 === 0 ? (
              <div className="text-[8px] font-mono text-white/20 whitespace-nowrap">
                {`0x${Math.random().toString(16).slice(2, 10)} >> HEXA_CORE`}
              </div>
            ) : (
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Video Controls */}
      <div className="fixed bottom-10 left-10 z-[110] flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsVideoPaused(!isVideoPaused)}
          className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          {isVideoPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsVideoMuted(!isVideoMuted)}
          className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          {isVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Video Controls */}
      <div className="fixed bottom-10 left-10 z-[110] flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsVideoPaused(!isVideoPaused)}
          className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          {isVideoPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsVideoMuted(!isVideoMuted)}
          className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          {isVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </motion.button>
      </div>
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
                  <div className="w-8 h-8 bg-text text-bg rounded-lg flex items-center justify-center font-bold text-sm">H</div>
                  <h3 className="text-xl font-display font-bold text-text">HexaCore Documentation</h3>
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
                  <h2 className="text-3xl font-display font-bold mb-6 text-text">Welcome to the 6th Dimension</h2>
                  <p className="text-muted leading-relaxed mb-8">
                    HexaCore is a unified ecosystem where global learning, competitive coding, professional networking, career acceleration, digital knowledge mastery, and AI innovation converge into a single, immersive experience.
                  </p>

                  <div className="space-y-12 mb-12">
                    {dimensions.map((dim) => (
                      <div key={dim.id} className="bg-surface/30 p-8 rounded-3xl border border-border">
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5`}>
                            <dim.icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-display font-bold text-text m-0">Dimension {dim.id}: {dim.title}</h4>
                            <p className="text-white/40 text-sm font-mono mt-1">@hexa/{dim.title.toLowerCase().replace(/\s+/g, '-')}</p>
                          </div>
                        </div>
                        <div className="space-y-4 text-muted text-sm leading-relaxed">
                          <p>{dim.fullDescription}</p>
                          <ul className="list-disc pl-5 space-y-2 text-muted">
                            {dim.features.map((f, i) => (
                              <li key={i}><strong className="text-text">{f.title}:</strong> {f.desc}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-2xl font-display font-bold mb-4 text-text">Quick Start Guide</h3>
                  <div className="bg-surface/50 rounded-xl p-4 border border-border mb-8 font-mono text-sm text-text">
                    <div className="text-muted mb-2"># Initialize the Hexa SDK</div>
                    <div className="text-blue-400">npm install</div> <div className="inline">@hexa/sdk</div>
                    <br/><br/>
                    <div className="text-muted mb-2"># Authenticate your client</div>
                    <div className="text-purple-400">import</div> <div className="inline">{`{ HexaClient }`}</div> <div className="text-purple-400">from</div> <div className="text-green-400">'@hexa/sdk'</div>;
                    <br/>
                    <div className="text-purple-400">const</div> <div className="inline">client = </div><div className="text-purple-400">new</div> <div className="inline">HexaClient(</div><div className="text-green-400">'YOUR_API_KEY'</div><div className="inline">);</div>
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