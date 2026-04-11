import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Globe, Code, Users, Briefcase, Library, ArrowRight, LogOut, Scale } from "lucide-react";
import { useRole } from "../contexts/RoleContext";
import { useSettings } from "../contexts/SettingsContext";
import FeedbackForm from "./FeedbackForm";

const dimensions = [
  {
    id: "study",
    title: "Global Study Platform",
    description: "Borderless learning, connecting mentors and peers globally.",
    icon: Globe,
    color: "from-blue-500 to-cyan-400",
    path: "/study",
    allowedRoles: ["student", "teacher", "personal", "admin"]
  },
  {
    id: "coding",
    title: "Elite Coding Arena",
    description: "Compete, collaborate, and conquer algorithms.",
    icon: Code,
    color: "from-purple-500 to-pink-500",
    path: "/coding",
    allowedRoles: ["student", "personal", "admin"]
  },
  {
    id: "network",
    title: "Professional Network",
    description: "Connect with industry leaders and peers.",
    icon: Users,
    color: "from-emerald-500 to-green-400",
    path: "/network",
    allowedRoles: ["teacher", "personal", "admin"]
  },
  {
    id: "career",
    title: "Career Launchpad",
    description: "Accelerate your professional journey.",
    icon: Briefcase,
    color: "from-orange-500 to-red-500",
    path: "/career",
    allowedRoles: ["personal", "admin"]
  },
  {
    id: "library",
    title: "Digital Knowledge Library",
    description: "Access the collective intelligence of Penta.",
    icon: Library,
    color: "from-indigo-500 to-blue-500",
    path: "/library",
    allowedRoles: ["student", "teacher", "personal", "admin"]
  },
  {
    id: "poly-argu-minds",
    title: "Poly Argu-Minds",
    description: "Engage in structured debates and critical thinking.",
    icon: Scale,
    color: "from-yellow-500 to-orange-400",
    path: "https://ploy-argu-minds.vercel.app/",
    allowedRoles: ["student", "teacher", "personal", "admin"],
    isExternal: true
  }
];

export default function DimensionSelection() {
  const { role } = useRole();
  const { theme } = useSettings();

  const filteredDimensions = dimensions.filter(dim => dim.allowedRoles.includes(role));

  return (
    <div className="min-h-screen bg-bg text-text p-8 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
      {/* Logout Button */}
      <div className="absolute top-6 right-6 z-50">
        <Link 
          to="/login"
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-sm font-medium text-muted hover:text-text transition-all backdrop-blur-md"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Link>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl w-full">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-black tracking-tight mb-4 text-text"
          >
            Select Your Dimension
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted text-lg max-w-2xl mx-auto"
          >
            Choose your destination within the Penta ecosystem to begin your journey.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDimensions.map((dim, index) => {
            const Icon = dim.icon;
            const content = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-surface/50 backdrop-blur-xl border border-border hover:border-primary/50 rounded-3xl p-8 h-full flex flex-col transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${dim.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${dim.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-text group-hover:text-primary transition-colors">{dim.title}</h3>
                <p className="text-muted flex-grow mb-6">{dim.description}</p>
                
                <div className="flex items-center text-sm font-bold text-muted group-hover:text-primary transition-colors mt-auto">
                  Enter Dimension <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );

            if ((dim as any).isExternal) {
              return (
                <a key={dim.id} href={dim.path} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              );
            }

            return (
              <Link key={dim.id} to={dim.path}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
      <FeedbackForm />
    </div>
  );
}
