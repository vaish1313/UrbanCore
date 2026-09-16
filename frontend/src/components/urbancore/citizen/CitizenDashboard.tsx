import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, ContactShadows, Edges } from "@react-three/drei";
import * as THREE from "three";
import { 
  Search, MapPin, Activity, Droplets, Navigation, AlertTriangle, 
  Download, Sparkles, X, Eye, Leaf, ShieldAlert,
  TreePine, Wind, Sun, Info, ArrowRight, Loader2, CheckCircle2
} from "lucide-react";

// --- Data & Constants ---
const TIMELINE_NARRATION: Record<number, string> = {
  2021: "Mostly open land with natural vegetation and unpaved pathways.",
  2022: "Road connectivity improved with primary paving complete.",
  2023: "Initial residential development emerged in the eastern sector.",
  2024: "Commercial development expanded along the main arterial roads.",
  2025: "Mixed urban development with moderate environmental balance achieved."
};

const SUGGESTIONS = [
  { id: 1, name: "Gangapur Road", type: "Residential Area", img: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=100&h=100" },
  { id: 2, name: "College Road", type: "Commercial Hub", img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=100&h=100" },
  { id: 3, name: "Pathardi Phata", type: "Developing Zone", img: "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&q=80&w=100&h=100" },
];

// --- 3D Components ---
function DigitalTwin({ timelineYear, isMonitoring, onMapClick, mapPin }: { timelineYear: number; isMonitoring: boolean; onMapClick?: (p: THREE.Vector3) => void; mapPin: THREE.Vector3 | null }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current && !onMapClick) {
      // Only auto-rotate if not in interactive map mode
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const yearScale = (timelineYear - 2021) / 4; 

  const buildings = [
    { pos: [0, 1, 0], scale: [2, 2, 2], delay: 0 },
    { pos: [3, 1.5, 2], scale: [1.5, 3, 1.5], delay: 0.2 },
    { pos: [-3, 0.5, -2], scale: [2, 1, 2], delay: 0.4 },
    { pos: [2, 2.5, -3], scale: [1, 5, 1.5], delay: 0.6 },
    { pos: [-2, 1, 3], scale: [1.5, 2, 1.5], delay: 0.8 },
  ];

  return (
    <group ref={groupRef} position={[0, -2, -5]} rotation={onMapClick ? [0, 0, 0] : [0.2, 0, 0]}>
      <mesh 
        position={[0, -0.25, 0]} 
        receiveShadow 
        onClick={(e) => {
          if (onMapClick) {
            e.stopPropagation();
            onMapClick(e.point);
          }
        }}
      >
        <boxGeometry args={[16, 0.5, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
        <Edges scale={1.001} color="rgba(255,255,255,0.05)" />
      </mesh>

      <gridHelper args={[16, 16, "#334155", "#1e293b"]} position={[0, 0.01, 0]} />

        {/* Dropped Map Pin */}
      {mapPin && (
        <group position={[mapPin.x, 0.5, mapPin.z]}>
          <mesh position={[0, 0.5, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.3, 1, 16]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#22d3ee" />
          </mesh>
          <pointLight color="#22d3ee" intensity={2} distance={3} />
        </group>
      )}

      {buildings.map((b, i) => {
        const delay = b.delay ?? 0;
        const activeScale = Math.max(0.01, yearScale - (delay * 0.5));
        const finalScale = [b.scale[0], b.scale[1] * activeScale, b.scale[2]] as [number, number, number];
        
        return (
          <mesh key={i} position={b.pos as [number, number, number]} scale={finalScale} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={isMonitoring ? "#0f766e" : "#1e293b"} roughness={0.7} metalness={0.2} />
            <Edges scale={1.01} color={isMonitoring ? "#14b8a6" : "#60a5fa"} />
          </mesh>
        );
      })}
      
      {isMonitoring && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4, 4.2, 64]} />
          <meshBasicMaterial color="#14b8a6" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function SceneBackground({ timelineYear, isMonitoring, isMapMode, onMapClick, mapPin }: { timelineYear: number; isMonitoring: boolean; isMapMode: boolean; onMapClick?: (p: THREE.Vector3) => void; mapPin: THREE.Vector3 | null }) {
  const digitalTwinProps: any = { timelineYear, isMonitoring, mapPin };
  if (isMapMode && onMapClick) {
    digitalTwinProps.onMapClick = onMapClick;
  }
  
  return (
    <div className={`fixed inset-0 z-0 ${isMapMode ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}>
      <Canvas shadows camera={{ position: [0, 5, 12], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.4} />
        <directionalLight 
          castShadow 
          position={[10, 10, 5]} 
          intensity={1.5} 
          color="#ffffff"
          shadow-mapSize={[1024, 1024]}
        />
        <Stars radius={100} depth={50} count={2000} factor={3} saturation={0} fade speed={1} />
        <fog attach="fog" args={['#020617', 10, 30]} />
        <DigitalTwin {...digitalTwinProps} />
        <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
        {isMapMode && <OrbitControls enablePan={true} enableZoom={true} maxPolarAngle={Math.PI / 2.1} />}
      </Canvas>
    </div>
  );
}

// --- Main Workspace Component ---
export function CitizenDashboard({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoc, setSelectedLoc] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [timelineYear, setTimelineYear] = useState(2025);
  const [aiReportStage, setAiReportStage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOrbOpen, setAiOrbOpen] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  // Interactive Map State
  const [isMapMode, setIsMapMode] = useState(false);
  const [mapPin, setMapPin] = useState<THREE.Vector3 | null>(null);

  const handleMapClick = (point: THREE.Vector3) => {
    setMapPin(point);
    setSelectedLoc({
      id: 999,
      name: `Lat: ${(point.z * 10).toFixed(4)}, Lng: ${(point.x * 10).toFixed(4)}`,
      type: "Custom Pinned Location",
      img: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=100&h=100"
    });
    setSearchQuery(`Lat: ${(point.z * 10).toFixed(4)}, Lng: ${(point.x * 10).toFixed(4)}`);
    setIsMapMode(false);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating && aiReportStage < 7) {
      timer = setTimeout(() => setAiReportStage(prev => prev + 1), 1200);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isGenerating, aiReportStage]);

  const reportSteps = [
    "Scanning satellite imagery...",
    "Comparing historical imagery...",
    "Analysing environmental changes...",
    "Checking nearby development...",
    "Reviewing community reports...",
    "Preparing AI insights...",
    "Generating report..."
  ];

  return (
    <div 
      ref={containerRef}
      className={`w-full relative h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden scroll-smooth bg-transparent text-slate-200 ${isMapMode ? 'pointer-events-none' : 'pointer-events-auto'}`}
    >
      <SceneBackground 
        timelineYear={timelineYear} 
        isMonitoring={isMonitoring} 
        isMapMode={isMapMode} 
        onMapClick={handleMapClick} 
        mapPin={mapPin} 
      />

      {/* Map Mode Exit Overlay */}
      <AnimatePresence>
        {isMapMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto flex flex-col items-center gap-4"
          >
            <div className="bg-cyan-500/20 text-cyan-300 px-6 py-3 rounded-full backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)] font-medium animate-pulse">
              Click anywhere on the map to drop a pin
            </div>
            <button 
              onClick={() => setIsMapMode(false)}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full backdrop-blur-xl border border-white/10 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={isMapMode ? 'opacity-0 transition-opacity duration-500' : 'opacity-100 transition-opacity duration-500'}>
        {/* Section 1: Hero */}
        <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center p-8 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl w-full text-center pointer-events-auto"
          >
            <h1 className="font-display text-5xl sm:text-7xl font-semibold tracking-tight text-white mb-6">
              Explore Your Locality
            </h1>
            <p className="text-xl text-slate-400 font-light mb-12 max-w-2xl mx-auto">
              Understand how your surroundings have evolved through AI-powered satellite intelligence.
            </p>
          </motion.div>
        </section>

        {/* Section 2: Smart Search */}
        <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center p-8 z-10 pointer-events-auto">
          <div className="w-full max-w-2xl relative">
            <div className="glass-panel p-2 rounded-2xl flex items-center bg-white/5 border border-white/10 backdrop-blur-xl focus-within:border-cyan-500/50 transition-colors shadow-2xl">
              <Search className="h-6 w-6 text-slate-400 ml-4 mr-2" />
              <input 
                type="text" 
                placeholder="Search Address, PIN Code, Village, Landmark..." 
                className="flex-1 bg-transparent border-none outline-none text-lg p-3 text-white placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(e.target.value.length > 0);
                }}
              />
            </div>
            
            <AnimatePresence>
              {showSearchSuggestions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-full mt-4 glass-panel rounded-2xl overflow-hidden bg-[#0a0f1d]/90 backdrop-blur-2xl border border-white/10 shadow-2xl"
                >
                  {SUGGESTIONS.map((sug) => (
                    <div 
                      key={sug.id} 
                      className="p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                      onClick={() => {
                        setSelectedLoc(sug);
                        setShowSearchSuggestions(false);
                        setSearchQuery(sug.name);
                      }}
                    >
                      <img src={sug.img} alt={sug.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-white font-medium">{sug.name}</h4>
                        <span className="text-xs text-slate-400">{sug.type}</span>
                      </div>
                    </div>
                  ))}
                  <div 
                    className="p-4 flex items-center gap-4 hover:bg-cyan-500/10 cursor-pointer transition-colors border-t border-cyan-500/20 text-cyan-400"
                    onClick={() => {
                      setShowSearchSuggestions(false);
                      setIsMapMode(true);
                    }}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-cyan-500/20">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Drop a pin on map</h4>
                      <span className="text-xs opacity-70">Manually select location</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Section 3: Interactive Map */}
        {selectedLoc && (
          <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center p-8 z-10 pointer-events-auto">
            <div className="w-full max-w-6xl h-[70vh] glass-panel rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl group bg-[#020617]/50 backdrop-blur-xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <span className="font-mono text-sm tracking-widest text-cyan-400 animate-pulse">INTERACTIVE MAP ACTIVE</span>
                <button 
                  onClick={() => setIsMapMode(true)}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl backdrop-blur-xl border border-white/10 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <MapPin className="h-4 w-4" /> Drop New Pin
                </button>
              </div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-8 left-8 glass-panel p-6 rounded-2xl max-w-sm bg-black/40 backdrop-blur-xl border border-white/10"
              >
                <h3 className="text-2xl font-display font-semibold text-white mb-1">{selectedLoc.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{selectedLoc.type}</p>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Activity className="h-4 w-4 text-cyan-400" /> Nearby Development: High
                  </div>
                  <button className="mt-2 w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium">
                    Explore Property
                  </button>
                </div>
              </motion.div>
            </div>
          </section>
        )}

      {/* Section 4: Property Insights */}
      {selectedLoc && (
        <section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center p-8 z-10 pointer-events-auto">
          <h2 className="font-display text-4xl font-semibold text-white mb-12 text-center">Property Insights</h2>
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <InsightCard icon={TreePine} title="Green Cover" text="Dense vegetation preserved in the northern sector." color="text-emerald-400" />
            <InsightCard icon={Navigation} title="Road Connectivity" text="Primary access road completed recently." color="text-blue-400" />
            <InsightCard icon={Droplets} title="Water Availability" text="Proximity to natural drainage paths detected." color="text-cyan-400" />
            <InsightCard icon={Activity} title="Development Activity" text="Moderate residential construction in the vicinity." color="text-orange-400" />
          </div>
        </section>
      )}

      {/* Section 5: Monitor My Property */}
      {selectedLoc && (
        <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center p-8 z-10 pointer-events-auto">
          <motion.div className="glass-panel p-12 rounded-3xl w-full max-w-4xl text-center bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <Eye className="h-12 w-12 text-cyan-400 mx-auto mb-6" />
            <h2 className="font-display text-4xl font-semibold text-white mb-4">Monitor My Property</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
              Monitor changes around your selected property using AI-powered satellite imagery. Receive alerts for nearby construction or environmental changes.
            </p>
            
            {!isMonitoring ? (
              <button 
                onClick={() => setIsMonitoring(true)}
                className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 px-8 py-4 rounded-full font-medium transition-all duration-300 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
              >
                Start Monitoring
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl inline-block text-left"
              >
                <div className="flex items-center gap-3 text-emerald-400 font-medium mb-4">
                  <CheckCircle2 className="h-5 w-5" /> Monitoring Active
                </div>
                <div className="flex gap-8 text-sm text-slate-300">
                  <div>
                    <span className="block text-slate-500 text-xs uppercase mb-1">Last Checked</span>
                    Today, 08:30 AM
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs uppercase mb-1">Status</span>
                    No changes detected
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </section>
      )}

      {/* Section 6: Property Evolution */}
      {selectedLoc && (
        <section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center p-8 z-10 pointer-events-auto">
          <div className="w-full max-w-4xl text-center mb-16">
            <h2 className="font-display text-4xl font-semibold text-white mb-4">Property Evolution</h2>
            <p className="text-slate-400">Discover how this location has transformed over the years using satellite imagery and AI.</p>
          </div>

          <div className="w-full max-w-3xl glass-panel p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10">
            <input 
              type="range" 
              min="2021" 
              max="2025" 
              value={timelineYear} 
              onChange={(e) => setTimelineYear(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between mt-6 px-2 mb-8">
              {[2021, 2022, 2023, 2024, 2025].map(y => (
                <div key={y} className={`font-mono text-xs transition-colors duration-300 ${timelineYear >= y ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {y}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={timelineYear}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 bg-white/5 rounded-2xl border border-white/5 text-slate-300 leading-relaxed text-center"
              >
                {TIMELINE_NARRATION[timelineYear]}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Section 7: AI Property Summary */}
      {selectedLoc && (
        <section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center p-8 z-10 pointer-events-auto">
          <div className="w-full max-w-2xl text-center">
            <h2 className="font-display text-4xl font-semibold text-white mb-10">Generate Property Summary</h2>
            
            {!isGenerating ? (
              <button 
                onClick={() => {
                  setIsGenerating(true);
                  setAiReportStage(0);
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-medium transition-colors flex items-center gap-3 mx-auto"
              >
                <Sparkles className="h-5 w-5 text-cyan-400" /> Generate AI Summary
              </button>
            ) : (
              <div className="glass-panel p-8 rounded-3xl text-left bg-black/40 backdrop-blur-xl border border-white/10">
                <div className="min-h-[220px] font-mono text-sm flex flex-col gap-4 text-slate-400">
                  {reportSteps.map((step, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: aiReportStage >= idx ? 1 : 0, x: aiReportStage >= idx ? 0 : -10 }}
                      className={`flex items-center gap-3 ${idx === 6 ? "text-cyan-400 font-semibold mt-4" : ""}`}
                    >
                      {aiReportStage === idx && idx < 6 && <Loader2 className="h-3 w-3 animate-spin" />}
                      {aiReportStage > idx && idx < 6 && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                      {step}
                    </motion.div>
                  ))}
                </div>
                
                <AnimatePresence>
                  {aiReportStage >= 7 && (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 flex items-center justify-center gap-2 w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 py-4 rounded-xl transition-colors font-medium border border-cyan-500/30"
                    >
                      <Download className="h-5 w-5" /> Download Professional PDF
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 8: Community Reports */}
      {selectedLoc && (
        <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center p-8 z-10 pointer-events-auto">
          <div className="w-full max-w-4xl">
            <h2 className="font-display text-4xl font-semibold text-white mb-10">Community Reports</h2>
            <div className="glass-panel p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 text-center">
              <ShieldAlert className="h-10 w-10 text-emerald-400 mx-auto mb-4 opacity-80" />
              <p className="text-lg text-slate-300 font-medium mb-2">Safe & Clear</p>
              <p className="text-slate-500">No recent community reports have been submitted near this locality.</p>
            </div>
          </div>
        </section>
      )}

      </div> {/* Close the isMapMode UI hiding wrapper */}

      {/* Section 9: Floating UrbanCore AI */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end pointer-events-auto">
        <AnimatePresence>
          {aiOrbOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-panel rounded-3xl w-[350px] h-[450px] mb-4 shadow-2xl flex flex-col overflow-hidden bg-black/80 backdrop-blur-3xl border border-white/10"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-xl">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="font-medium text-sm text-white font-display">UrbanCore AI</span>
                </div>
                <button 
                  onClick={() => setAiOrbOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 text-sm">
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 text-slate-300 max-w-[85%] self-start leading-relaxed shadow-lg">
                  Hello! I'm your locality assistant. Would you like me to explain the green cover changes or recent zoning updates?
                </div>
              </div>
              <div className="p-4 border-t border-white/10 bg-white/5 flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Ask UrbanCore AI..." 
                  className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setAiOrbOpen(!aiOrbOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="glass-panel w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)] bg-black/80 hover:bg-black transition-colors border border-cyan-500/30"
        >
          <Sparkles className="h-6 w-6 text-cyan-400" />
        </motion.button>
      </div>

    </div>
  );
}

// Helper Components
function InsightCard({ icon: Icon, title, text, color }: { icon: any; title: string; text: string; color: string }) {
  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 group hover:bg-white/5 transition-all hover:-translate-y-1 bg-black/20 backdrop-blur-xl border border-white/10">
      <div className={`p-3 bg-white/5 rounded-2xl w-fit ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-white font-medium mb-2 text-lg font-display">{title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
