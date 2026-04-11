import { ArrowLeft, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function NetworkDashboard() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none" />
      <nav className="relative z-10 mb-12">
        <Link to="/select-dimension" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Ecosystem
        </Link>
      </nav>
      <main className="relative z-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold">Professional Network</h1>
            <p className="text-zinc-400 mt-1">Connect with industry leaders and peers.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold mb-2">Connections</h3>
            <p className="text-3xl font-display text-emerald-400">500+</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold mb-2">Profile Views</h3>
            <p className="text-3xl font-display text-emerald-400">1.2K</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold mb-2">Endorsements</h3>
            <p className="text-3xl font-display text-emerald-400">42</p>
          </div>
        </div>
      </main>
    </div>
  );
}
