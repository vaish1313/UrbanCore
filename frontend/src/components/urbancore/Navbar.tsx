import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  Layers, Map, BarChart3, Radar,
  Building2, Landmark, Users,
  Satellite, BrainCircuit, ScanSearch,
  Clock, TrendingUp, Search, FileText,
  Info, Target, BookOpen, Mail,
  ChevronDown
} from "lucide-react";

interface NavbarProps {
  entered: boolean;
  activeRole: any;
  onLoginClick: () => void;
}

const NAV_ITEMS = [
  {
    label: "Platform",
    desc: "Explore the core capabilities of UrbanCore.",
    items: [
      { name: "Urban Change Detection", icon: Layers },
      { name: "Land Monitoring", icon: Map },
      { name: "Multi-Temporal Analysis", icon: Radar },
      { name: "Urban Insights", icon: BarChart3 },
    ]
  },
  {
    label: "Solutions",
    desc: "Urban intelligence for different city stakeholders.",
    items: [
      { name: "Builder / Developer", icon: Building2 },
      { name: "Municipal Authority", icon: Landmark },
      { name: "Citizen", icon: Users },
    ]
  },
  {
    label: "How It Works",
    desc: "From Sentinel-2 imagery to actionable urban change insights.",
    items: [
      { name: "Satellite Data", icon: Satellite },
      { name: "AI-Powered Detection", icon: BrainCircuit },
      { name: "Change Analysis", icon: ScanSearch },
    ]
  },
  {
    label: "Data & Insights",
    desc: "Explore how landscapes evolve across time.",
    items: [
      { name: "Change Timeline", icon: Clock },
      { name: "Urban Growth", icon: TrendingUp },
      { name: "Satellite Insights", icon: Search },
      { name: "Reports & Analytics", icon: FileText },
    ]
  },
  {
    label: "About Us",
    desc: "Learn about the project, research and team.",
    items: [
      { name: "About UrbanCore", icon: Info },
      { name: "Our Mission", icon: Target },
      { name: "Research", icon: BookOpen },
      { name: "Contact Us", icon: Mail },
    ]
  }
];

export function Navbar({ entered, activeRole, onLoginClick }: NavbarProps) {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-6 sm:px-10 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: entered && !activeRole ? 1 : 0 }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseLeave={() => setHoveredNav(null)}
    >
      <div className="flex items-center gap-12">
        <a href="/" className="text-2xl font-bold tracking-tight text-white cursor-pointer z-10 hover:opacity-90 transition-opacity">
          Urban<span className="text-blue-500">Core</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-slate-300">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative py-2 group cursor-pointer"
              onMouseEnter={() => setHoveredNav(item.label)}
            >
              {item.label === "Platform" ? (
                <a href="/platform" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                  {item.label}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${hoveredNav === item.label ? "rotate-180 text-cyan-400" : "text-slate-500"}`} />
                </a>
              ) : item.label === "Solutions" ? (
                <a href="/solutions" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                  {item.label}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${hoveredNav === item.label ? "rotate-180 text-cyan-400" : "text-slate-500"}`} />
                </a>
              ) : item.label === "How It Works" ? (
                <a href="/how-it-works" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                  {item.label}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${hoveredNav === item.label ? "rotate-180 text-cyan-400" : "text-slate-500"}`} />
                </a>
              ) : item.label === "Data & Insights" ? (
                <a href="/data" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                  {item.label}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${hoveredNav === item.label ? "rotate-180 text-cyan-400" : "text-slate-500"}`} />
                </a>
              ) : item.label === "About Us" ? (
                <a href="/about" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                  {item.label}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${hoveredNav === item.label ? "rotate-180 text-cyan-400" : "text-slate-500"}`} />
                </a>
              ) : (
                <div className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                  {item.label}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${hoveredNav === item.label ? "rotate-180 text-cyan-400" : "text-slate-500"}`} />
                </div>
              )}
              <span className={`absolute bottom-0 left-0 h-[2px] bg-cyan-400 transition-all duration-300 shadow-[0_0_8px_rgba(34,211,238,0.6)] ${hoveredNav === item.label ? "w-full" : "w-0"}`}></span>

              {/* Mega Menu Dropdown */}
              <AnimatePresence>
                {hoveredNav === item.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-0 top-[calc(100%+8px)] w-64 rounded-2xl border border-white/10 bg-black/95 p-2 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
                  >
                    <div className="mb-2 px-3 pb-2 pt-2 border-b border-white/5">
                      <p className="text-[11px] leading-relaxed text-slate-400 font-light">{item.desc}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {item.items.map((subItem, idx) => {
                        const Icon = subItem.icon;
                        return (
                          <div
                            key={idx}
                            className="group/sub flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-cyan-500/10"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors group-hover/sub:bg-cyan-500/20 group-hover/sub:text-cyan-400">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-[13px] font-medium text-slate-300 transition-colors group-hover/sub:text-cyan-400">
                              {subItem.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-6 z-10">
        <button
          onClick={onLoginClick}
          className="hidden md:block text-[13px] font-medium text-slate-300 hover:text-cyan-400 transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={onLoginClick}
          className="text-[11px] font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:-translate-y-0.5"
        >
          Launch UrbanCore <span className="text-[10px] leading-none mb-[1px]">↗</span>
        </button>
      </div>
    </motion.header>
  );
}
