/**
 * MunicipalGISDashboard
 *
 * Municipal Corporation workspace dashboard — built on the EXACT same design
 * system as CitizenDashboard / MyReports:
 *   - glass-panel utility for all card surfaces
 *   - font-display (Sora), font-mono (JetBrains Mono) Tailwind classes
 *   - text-primary / text-accent / text-destructive / text-muted-foreground
 *   - Status pills matching citizen's cs-report-status hex palette
 *   - Gradient primary button (#06b6d4 → #3b82f6) from MyReports
 *   - Framer Motion whileHover y-lift identical to citizen cards
 *   - Page layout matching cs-page / cs-content / cs-section-divider / cs-footer
 *   - No new colors, fonts, or component styles introduced
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3, Layers, RefreshCw, Flame, AlertTriangle, CheckCircle2,
  Clock, FileText, Satellite, Crosshair, MapPin, ShieldAlert, Download,
  Printer, ChevronRight, Flag, Eye, ArrowLeft,
} from "lucide-react";
import * as THREE from "three";

// ─── Design tokens (matching citizen exact hex values) ────────────────────────
const T = {
  cyan:     "#22d3ee",   // cyan-400 — primary accent
  cyan500:  "#06b6d4",   // cyan-500 — gradient start
  blue500:  "#3b82f6",   // blue-500 — gradient end
  slate100: "#f1f5f9",   // titles
  slate200: "#e2e8f0",   // body text
  slate300: "#cbd5e1",
  slate400: "#94a3b8",   // secondary text
  slate500: "#64748b",   // muted
  slate600: "#475569",   // very muted
  slate700: "#334155",   // near-invisible
  navy:     "rgba(13,20,40,0.72)",  // citizen card bg
  border:   "rgba(255,255,255,0.07)",
  borderHover: "rgba(34,211,238,0.15)",
  // status badge palette (from MyReports STATUS_STYLES)
  statusPending:    { bg:"rgba(250,204,21,0.1)",  text:"#fbbf24", border:"rgba(250,204,21,0.25)" },
  statusReview:     { bg:"rgba(251,146,60,0.1)",  text:"#fb923c", border:"rgba(251,146,60,0.25)" },
  statusResolved:   { bg:"rgba(52,211,153,0.1)",  text:"#34d399", border:"rgba(52,211,153,0.25)" },
  statusRejected:   { bg:"rgba(248,113,113,0.1)", text:"#f87171", border:"rgba(248,113,113,0.25)" },
  statusQueue:      { bg:"rgba(99,102,241,0.1)",  text:"#a5b4fc", border:"rgba(99,102,241,0.25)" },
  // severity
  sevHigh: { bg:"rgba(239,68,68,0.15)",   text:"#f87171", border:"rgba(239,68,68,0.3)" },
  sevMed:  { bg:"rgba(251,191,36,0.15)",  text:"#fbbf24", border:"rgba(251,191,36,0.3)" },
  sevLow:  { bg:"rgba(52,211,153,0.12)",  text:"#34d399", border:"rgba(52,211,153,0.3)" },
} as const;

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono, monospace)",
      fontSize: "0.65rem", letterSpacing: "0.15em",
      textTransform: "uppercase", color: T.cyan,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "var(--font-display, 'Sora', sans-serif)",
      fontSize: "clamp(1.4rem, 3vw, 1.85rem)",
      fontWeight: 700, color: T.slate100,
      letterSpacing: "-0.02em", margin: 0,
    }}>
      {children}
    </h2>
  );
}

function StatusPill({
  label, colors,
}: {
  label: string;
  colors: { bg: string; text: string; border: string };
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "3px 10px",
      borderRadius: 999, border: `1px solid ${colors.border}`,
      background: colors.bg, color: colors.text,
      fontFamily: "var(--font-mono, monospace)",
    }}>
      {label}
    </span>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16, width:"100%", margin:"0 0 8px" }}>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
      <span style={{
        fontFamily:"var(--font-mono,monospace)", fontSize:"0.625rem",
        letterSpacing:"0.18em", textTransform:"uppercase",
        color:"#334155", whiteSpace:"nowrap",
      }}>{label}</span>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// Primary gradient button (citizen MyReports style)
function PrimaryBtn({ children, onClick, icon }: {
  children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button" onClick={onClick}
      whileHover={{ scale: 1.03, boxShadow: "0 0 28px rgba(34,211,238,0.25)" }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: `linear-gradient(135deg, ${T.cyan500} 0%, ${T.blue500} 100%)`,
        color: "#fff", border: "none", borderRadius: 12,
        padding: "11px 22px", fontSize: "0.875rem", fontWeight: 600,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
      }}
    >
      {icon}{children}
    </motion.button>
  );
}

function OutlineBtn({ children, onClick, icon }: {
  children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button" onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: "rgba(255,255,255,0.04)",
        color: T.slate300, border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12, padding: "10px 20px",
        fontSize: "0.875rem", fontWeight: 500,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
      }}
    >
      {icon}{children}
    </motion.button>
  );
}

// ─── Three.js background (terrain + satellite + nodes) ────────────────────────

function useThreeScene(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const W = window.innerWidth, H = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 15, 38);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x0a2540, 1.5));
    const dl = new THREE.DirectionalLight(0x22d3ee, 2.0); dl.position.set(20,40,20); scene.add(dl);
    const pl = new THREE.PointLight(0x3b82f6, 3, 100); pl.position.set(-20,-10,15); scene.add(pl);

    const world = new THREE.Group(); scene.add(world);

    // Terrain
    const geo = new THREE.PlaneGeometry(80, 50, 48, 48);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const river = Math.sin(x * 0.08) * 8;
      const dist = Math.abs(y - river);
      let z = Math.sin(x * 0.15) * Math.cos(y * 0.15) * 2.5;
      z += dist < 5 ? -(5 - dist) * 1.8 : Math.sin(x * 0.3) * 1.2;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      color: 0x0a2a44, wireframe: true, transparent: true, opacity: 0.3,
    }));
    terrain.rotation.x = -Math.PI / 2.5; terrain.position.y = -10;
    world.add(terrain);

    // Radar rings
    const mkRing = (r: number, c: number, op: number) => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(r, r + 0.25, 64),
        new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: true, opacity: op }),
      );
      m.rotation.x = -Math.PI / 2.5; m.position.y = -8;
      world.add(m); return m;
    };
    const ring1 = mkRing(18, 0x22d3ee, 0.55);
    const ring2 = mkRing(26, 0x3b82f6, 0.22);

    // AOI sensor nodes
    const nodes: Array<{ mesh: THREE.Mesh; y0: number; speed: number; alert: boolean }> = [];
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const r = 10 + (i % 5) * 3.5;
      const x = Math.cos(angle) * r + (Math.random() - 0.5) * 4;
      const z = Math.sin(angle) * r * 0.6 + (Math.random() - 0.5) * 4;
      const y = -6 + Math.sin(i * 1.5) * 2;
      const isAlert = i === 7 || i === 18;
      const color = isAlert ? 0xf87171 : i % 4 === 0 ? 0xfbbf24 : 0x34d399;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(isAlert ? 0.65 : 0.35, 12, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: isAlert ? 0.95 : 0.8 }),
      );
      mesh.position.set(x, y, z); world.add(mesh);
      const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,y,z), new THREE.Vector3(x,-10,z)]);
      world.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: isAlert ? 0xf87171 : 0x22d3ee, transparent: true, opacity: isAlert ? 0.6 : 0.22 })));
      nodes.push({ mesh, y0: y, speed: 0.8 + Math.random() * 0.6, alert: isAlert });
    }

    // Satellite
    const sat = new THREE.Group(); world.add(sat);
    sat.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.6), new THREE.MeshLambertMaterial({ color: 0x22d3ee })));
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 0.9), new THREE.MeshLambertMaterial({ color: 0x3b82f6 }));
    panel.position.x = -1.8; sat.add(panel);
    const panelR = panel.clone(); panelR.position.x = 1.8; sat.add(panelR);
    sat.position.set(18, 14, 5);
    const beam = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(-14,-20,0)]),
      new THREE.LineDashedMaterial({ color: 0x22d3ee, dashSize: 0.8, gapSize: 0.4, transparent: true, opacity: 0.45 }),
    );
    beam.computeLineDistances(); sat.add(beam);

    // Particles
    const pGeo = new THREE.BufferGeometry();
    const pArr = new Float32Array(600);
    for (let i = 0; i < 600; i += 3) {
      pArr[i] = (Math.random() - 0.5) * 70;
      pArr[i+1] = (Math.random() - 0.5) * 35;
      pArr[i+2] = (Math.random() - 0.5) * 40;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pArr, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.3, transparent: true, opacity: 0.35 }));
    world.add(particles);

    let mx = 0, my = 0;
    const onMouse = (e: MouseEvent) => { mx = (e.clientX / W - 0.5) * 2; my = (e.clientY / H - 0.5) * 2; };
    const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      world.rotation.y += (mx * 0.05 - world.rotation.y) * 0.03 + 0.001;
      world.rotation.x += (my * 0.03 - world.rotation.x) * 0.03;
      ring1.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06);
      ring2.scale.setScalar(1 + Math.cos(t * 1.2) * 0.08);
      sat.position.x = Math.cos(t * 0.25) * 22;
      sat.position.z = Math.sin(t * 0.25) * 12;
      sat.position.y = 12 + Math.sin(t * 0.5) * 1.5;
      sat.rotation.y = -t * 0.25;
      nodes.forEach((n, i) => {
        n.mesh.position.y = n.y0 + Math.sin(t * n.speed + i) * 0.35;
        if (n.alert) { const s = 1 + Math.sin(t * 4) * 0.25; n.mesh.scale.set(s,s,s); }
      });
      particles.rotation.y = t * 0.012;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [ref]);
}

// ─── Section 1 · District Overview Map ───────────────────────────────────────

function DistrictMap() {
  const [activeLayer, setActiveLayer] = useState<"heatmap"|"satellite"|"zoning">("heatmap");
  const [selectedAoi, setSelectedAoi] = useState<null|{ id:string; name:string; cases:number; conf:number; x:number; y:number }>(null);

  const greenAois:  [number,number][] = [[110,120],[210,100],[310,140],[180,200],[130,410],[240,450],[360,430],[490,390],[560,440],[680,400],[820,380],[910,330],[990,280],[1060,220],[620,130],[740,110],[880,140],[1020,120]];
  const amberAois:  [number,number][] = [[280,230],[390,190],[540,290],[670,220],[760,320],[850,250],[330,340]];
  const redAois:    [number,number][] = [[490,210],[610,300],[710,270],[890,220]];

  return (
    <section>
      <SectionDivider label="District Overview Map" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* header row */}
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-end", gap:12 }}>
          <div>
            <EyebrowLabel><Satellite size={13} /> District Overview Map</EyebrowLabel>
            <SectionTitle>Nashik District – 30 Monitored AOIs</SectionTitle>
          </div>
          <div className="cs-muni-status-row">
            {[
              { label:"18 Nominal",         color:"#34d399", glow:"#34d399" },
              { label:"7 Moderate",          color:"#fbbf24", glow:"#fbbf24" },
              { label:"5 High Construction", color:"#f87171", glow:"#f43f5e", bold:true },
            ].map(s => (
              <span key={s.label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.8rem",
                color:s.color, fontWeight: s.bold ? 700 : 500, fontFamily:"var(--font-mono,monospace)" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:s.color, boxShadow:`0 0 8px ${s.glow}`, display:"inline-block" }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* map card */}
        <motion.div
          className="glass-panel"
          whileHover={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
          style={{ borderRadius:20, overflow:"hidden", position:"relative", height:500 }}
        >
          {/* terrain SVG base */}
          <div style={{ position:"absolute", inset:0, background:"rgba(13,20,40,0.72)",
            backgroundImage: activeLayer === "satellite" ? "radial-gradient(ellipse at 60% 40%, rgba(34,211,238,0.06) 0%, transparent 70%)" : "none",
          }} />

          {/* layer toggle pills */}
          <div style={{ position:"absolute", top:16, left:16, zIndex:10, display:"flex", gap:8, flexWrap:"wrap" }}>
            {([
              { id:"heatmap",   icon:<Flame size={14}/>,   label:"Heatmap: Active" },
              { id:"satellite", icon:<Satellite size={14}/>, label:"Satellite 4K" },
              { id:"zoning",    icon:<Layers size={14}/>,  label:"Zoning Layer (WRD / Forest)" },
            ] as const).map(l => (
              <button key={l.id} type="button" onClick={() => setActiveLayer(l.id)}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"7px 14px", borderRadius:999,
                  border: activeLayer === l.id ? `1px solid rgba(34,211,238,0.5)` : "1px solid rgba(255,255,255,0.1)",
                  background: activeLayer === l.id ? "rgba(34,211,238,0.15)" : "rgba(13,20,40,0.7)",
                  color: activeLayer === l.id ? T.cyan : T.slate400,
                  fontSize:"0.8rem", fontWeight: activeLayer === l.id ? 700 : 500,
                  cursor:"pointer", backdropFilter:"blur(12px)",
                  fontFamily:"var(--font-mono,monospace)", letterSpacing:"0.04em",
                  boxShadow: activeLayer === l.id ? "0 0 15px rgba(34,211,238,0.2)" : "none",
                }}>
                {l.icon}{l.label}
              </button>
            ))}
            <button type="button" onClick={() => setSelectedAoi(null)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:999,
                border:"1px solid rgba(255,255,255,0.08)", background:"rgba(13,20,40,0.7)",
                color:T.slate500, fontSize:"0.8rem", cursor:"pointer", backdropFilter:"blur(12px)",
                fontFamily:"var(--font-mono,monospace)",
              }}>
              <RefreshCw size={13} /> Reset View
            </button>
          </div>

          {/* SVG AOI layer */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
            <defs>
              <radialGradient id="mgRed" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f87171" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="mgAmber" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#451a03" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="mgGreen" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
              </radialGradient>
              <filter id="mgGlow">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#22d3ee" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* river artery */}
            <path d="M 30,340 Q 230,300 440,270 T 780,250 T 1150,190"
              fill="none" stroke={T.cyan} strokeWidth="2.5" strokeDasharray="6,4" strokeOpacity="0.35" />
            <text fill="#38bdf8" x="52" y="322" style={{ fontSize:"10px", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.15em", opacity:0.7 }}>
              Godavari Riparian Artery (100m Setback)
            </text>

            {/* green AOIs */}
            {greenAois.map(([cx,cy],i) => (
              <g key={`g${i}`} style={{ cursor:"pointer" }}
                onClick={() => setSelectedAoi({ id:`AOI-G${i+1}`, name:`Sector ${i+1}`, cases:0, conf:98, x:cx, y:cy })}>
                <circle cx={cx} cy={cy} r={14} fill="url(#mgGreen)" />
                <circle cx={cx} cy={cy} r={4} fill="#34d399" />
              </g>
            ))}
            {/* amber AOIs */}
            {amberAois.map(([cx,cy],i) => (
              <g key={`a${i}`} style={{ cursor:"pointer" }}
                onClick={() => setSelectedAoi({ id:`AOI-M${i+1}`, name:`Moderate Zone ${i+1}`, cases:1, conf:88, x:cx, y:cy })}>
                <circle cx={cx} cy={cy} r={18} fill="url(#mgAmber)" />
                <circle cx={cx} cy={cy} r={5} fill="#fbbf24" />
              </g>
            ))}
            {/* red AOIs */}
            {redAois.map(([cx,cy],i) => (
              <g key={`r${i}`} style={{ cursor:"pointer" }}
                onClick={() => setSelectedAoi({ id:`AOI-H${i+1}`, name:`High Construction ${i+1}`, cases:3, conf:96, x:cx, y:cy })}>
                <circle cx={cx} cy={cy} r={22} fill="url(#mgRed)" />
                <circle cx={cx} cy={cy} r={6} fill="#f87171" />
              </g>
            ))}

            {/* selected AOI-07 target */}
            <polygon points="420,250 470,240 485,280 435,290"
              fill="#dc2626" fillOpacity="0.55" stroke={T.cyan} strokeWidth="2" filter="url(#mgGlow)" />
            <circle cx={452} cy={265} r={30} fill="none" stroke={T.cyan}
              strokeWidth="1.5" strokeDasharray="5,4"
              style={{ transformOrigin:"452px 265px", animation:"mgSpin 12s linear infinite" }} />
            <circle cx={452} cy={265} r={7} fill="#f87171" />
            <polyline points="452,265 500,175 580,175" fill="none" stroke={T.cyan} strokeWidth="1.5" strokeDasharray="3,3" />
          </svg>

          {/* AOI-07 permanent callout */}
          <div style={{
            position:"absolute", top:130, left:"42%", zIndex:20,
            background:"rgba(13,20,40,0.92)", backdropFilter:"blur(20px)",
            border:`1px solid rgba(34,211,238,0.4)`, borderRadius:14,
            padding:"12px 16px", display:"flex", flexDirection:"column", gap:6,
            boxShadow:"0 0 30px rgba(34,211,238,0.15)",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
              <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:14, color:T.slate100, fontWeight:700 }}>
                AOI-07 • Gangapur Road
              </span>
              <StatusPill label="+42% Growth" colors={T.sevHigh} />
            </div>
            <span style={{ fontSize:12, color:T.slate400, fontWeight:500 }}>Anandwalli / River Buffer Zone</span>
            <div style={{ display:"flex", gap:8, paddingTop:6, borderTop:"1px solid rgba(255,255,255,0.08)",
              fontFamily:"var(--font-mono,monospace)", fontSize:11, color:T.cyan }}>
              <span>3 Active Cases</span><span>•</span><span>Confidence: 96%</span><span>•</span><span>20.0124°N</span>
            </div>
          </div>

          {/* clicked AOI callout */}
          <AnimatePresence>
            {selectedAoi && (
              <motion.div
                key={selectedAoi.id}
                initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
                style={{
                  position:"absolute", bottom:60, left:"50%", transform:"translateX(-50%)", zIndex:30,
                  background:"rgba(13,20,40,0.95)", backdropFilter:"blur(20px)",
                  border:`1px solid rgba(34,211,238,0.3)`, borderRadius:14,
                  padding:"12px 18px", display:"flex", alignItems:"center", gap:14,
                  boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
                }}>
                <Crosshair size={16} color={T.cyan} />
                <div>
                  <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:13, color:T.slate100, fontWeight:700 }}>{selectedAoi.id} — {selectedAoi.name}</div>
                  <div style={{ fontFamily:"var(--font-mono,monospace)", fontSize:11, color:T.slate400, marginTop:2 }}>
                    {selectedAoi.cases} active case{selectedAoi.cases !== 1 ? "s" : ""} · Confidence {selectedAoi.conf}%
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedAoi(null)}
                  style={{ background:"none", border:"none", cursor:"pointer", color:T.slate500, padding:4 }}>✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* bottom telemetry bar */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, zIndex:20,
            borderTop:"1px solid rgba(255,255,255,0.06)",
            background:"rgba(13,20,40,0.85)", backdropFilter:"blur(12px)",
            padding:"10px 20px", display:"flex", gap:20, flexWrap:"wrap",
            fontFamily:"var(--font-mono,monospace)", fontSize:11, color:T.slate500,
          }}>
            <span>CENTER: 20.0050° N, 73.7800° E</span>
            <span style={{ color:"rgba(255,255,255,0.1)" }}>|</span>
            <span>ELEVATION: 584m</span>
            <span style={{ color:"rgba(255,255,255,0.1)" }}>|</span>
            <span>RADAR: POL-SAR COMPOSITE</span>
            <span style={{ color:"rgba(255,255,255,0.1)" }}>|</span>
            <span style={{ color:T.cyan, fontWeight:700 }}>SYNC LOCK: 100%</span>
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes mgSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } .cs-muni-status-row{display:flex;flex-wrap:wrap;align-items:center;gap:20px;background:rgba(13,20,40,0.72);border:1px solid rgba(255,255,255,0.07);padding:8px 18px;border-radius:999px;backdrop-filter:blur(12px)}`}</style>
    </section>
  );
}

// ─── Section 2 · Priority Queue ───────────────────────────────────────────────

const CASES = [
  { id:"URB-10492", nk:"NK-2025-0894", conf:97, high:true,  icon:<AlertTriangle size={22} />, iconColor:"#f87171",
    title:"Gangapur Road, Plot 4A / Anandwalli Sector 4",
    detail:"Detected Oct 12, 2024 · 100m Godavari River Setback Incursion (−18.4m)",
    status:"UNDER REVIEW", statusColors: { bg:"rgba(251,146,60,0.1)", text:"#fb923c", border:"rgba(251,146,60,0.25)" } },
  { id:"URB-09211", nk:"NK-2025-0891", conf:91, high:false, icon:<FileText size={22} />, iconColor:"#34d399",
    title:"Trimbakeshwar Link Road, Plot 89",
    detail:"Detected Aug 05, 2024 · Eco-Forest Conservation Zone",
    status:"RESOLVED", statusColors: { bg:"rgba(52,211,153,0.1)", text:"#34d399", border:"rgba(52,211,153,0.25)" } },
  { id:"URB-08477", nk:"NK-2025-0888", conf:94, high:true,  icon:<Satellite size={22} />, iconColor:"#a5b4fc",
    title:"Panchavati Ghat Shoreline, Sector 2",
    detail:"Detected Feb 25, 2025 · High Blue Floodline Zone",
    status:"INSPECTION QUEUE", statusColors: { bg:"rgba(99,102,241,0.1)", text:"#a5b4fc", border:"rgba(99,102,241,0.25)" } },
] as const;

function PriorityQueue() {
  return (
    <section>
      <SectionDivider label="Priority Queue" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:8 }}>
          <div>
            <EyebrowLabel><Flag size={13} /> Priority Queue</EyebrowLabel>
            <SectionTitle>Detected Encroachment Flags</SectionTitle>
          </div>
          <button type="button" style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
            cursor:"pointer", color:T.cyan, fontFamily:"var(--font-mono,monospace)", fontSize:"0.8rem" }}>
            View All Encroachments <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {CASES.map(c => (
            <motion.div key={c.id}
              className="glass-panel"
              whileHover={{ y:-2, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", borderColor:"rgba(34,211,238,0.18)" }}
              style={{
                borderRadius:16, padding:"16px 20px",
                display:"flex", flexWrap:"wrap", alignItems:"center",
                justifyContent:"space-between", gap:16, cursor:"pointer",
                background:"rgba(13,20,40,0.72)",
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                {/* icon */}
                <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"center", color:c.iconColor }}>
                  {c.icon}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", color: c.high ? T.cyan : T.slate100,
                      fontWeight:700, fontSize:15, letterSpacing:"0.02em" }}>{c.id}</span>
                    <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:11, color:T.slate500 }}>({c.nk})</span>
                    <StatusPill label={`${c.conf}% ${c.high ? "High" : "Medium"} Confidence`}
                      colors={c.high ? T.sevHigh : T.sevMed} />
                  </div>
                  <span style={{ fontSize:14, color:T.slate200, fontWeight:500 }}>{c.title}</span>
                  <span style={{ fontSize:12, color:T.slate500 }}>{c.detail}</span>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                <StatusPill label={c.status} colors={c.statusColors} />
                <div style={{ width:34, height:34, borderRadius:"50%",
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"center", color:T.slate500 }}>
                  <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3 · Case Forensics ───────────────────────────────────────────────

const YEAR_NODES = [
  { year:2021, left:"2%",  top:"78%" },
  { year:2022, left:"26%", top:"35%" },
  { year:2023, left:"50%", top:"8%"  },
  { year:2024, left:"74%", top:"35%" },
  { year:2025, left:"98%", top:"78%" },
];

function CaseForensics() {
  const [val, setVal] = useState(2021);
  const t = (val - 2021) / 4;
  const intensity = Math.round(8 + t * 84);
  const stage = intensity < 25 ? "Pristine" : intensity < 55 ? "Emerging" : intensity < 80 ? "Active Incursion" : "Critical";
  const velocity = Math.round(t * 84);
  const nearest = Math.round(val);

  return (
    <section>
      <SectionDivider label="Deep Investigation" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <EyebrowLabel><Eye size={13} /> Deep Investigation</EyebrowLabel>
          <SectionTitle>Case Forensics &amp; Change Telemetry</SectionTitle>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))", gap:16 }}>
          {/* Left: Chrono-dial */}
          <motion.div className="glass-panel" whileHover={{ boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}
            style={{ borderRadius:20, padding:24, display:"flex", flexDirection:"column", gap:20,
              background:"rgba(13,20,40,0.72)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"rgba(34,211,238,0.08)",
                  border:"1px solid rgba(34,211,238,0.2)", display:"flex", alignItems:"center",
                  justifyContent:"center", color:T.cyan, flexShrink:0 }}>
                  <Satellite size={18} />
                </div>
                <div>
                  <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:14, color:T.slate100, fontWeight:700 }}>Construction Heatmap (2021 – 2025)</div>
                  <div style={{ fontSize:12, color:T.slate500 }}>Rotate the chrono-dial to scrub through 5 years of change</div>
                </div>
              </div>
              <span style={{ padding:"5px 14px", borderRadius:999,
                background:`linear-gradient(135deg, ${T.cyan500}, ${T.blue500})`,
                color:"#fff", fontSize:"0.75rem", fontWeight:700, whiteSpace:"nowrap" }}>Chrono Scrub</span>
            </div>

            {/* heatmap stage */}
            <div style={{ position:"relative", borderRadius:14, overflow:"hidden", height:240,
              background:"rgba(5,10,25,0.9)", border:"1px solid rgba(255,255,255,0.06)" }}>
              {/* heat overlay */}
              <div style={{ position:"absolute", inset:0, transition:"opacity 0.2s",
                background:"linear-gradient(135deg, rgba(127,0,0,0.7) 0%, rgba(180,80,10,0.4) 50%, transparent 100%)",
                mixBlendMode:"color-dodge", opacity: 0.05 + t * 0.75 }} />
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(to bottom, rgba(5,10,25,0.15) 0%, transparent 40%, rgba(5,10,25,0.9) 100%)" }} />
              {/* AOI tag */}
              <div style={{ position:"absolute", top:10, left:10, display:"flex", alignItems:"center", gap:6,
                padding:"5px 10px", borderRadius:10, border:"1px solid rgba(34,211,238,0.25)",
                background:"rgba(13,20,40,0.85)", backdropFilter:"blur(8px)" }}>
                <MapPin size={12} color={T.cyan} />
                <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:11, color:T.slate300 }}>AOI-07 · Gangapur Road</span>
              </div>
              {/* epoch */}
              <div style={{ position:"absolute", top:10, right:12 }}>
                <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:20, color:T.slate100, fontWeight:700 }}>{val.toFixed(1)}</span>
                <div style={{ fontFamily:"var(--font-mono,monospace)", fontSize:9, color:T.slate500, textTransform:"uppercase", letterSpacing:"0.18em" }}>Epoch Scrub</div>
              </div>
              {/* intensity */}
              <div style={{ position:"absolute", bottom:72, right:12, display:"flex", flexDirection:"column", gap:4,
                padding:"8px 12px", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)",
                background:"rgba(13,20,40,0.85)", backdropFilter:"blur(8px)" }}>
                <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:9, color:T.slate500, textTransform:"uppercase", letterSpacing:"0.12em" }}>Construction Intensity</span>
                <div style={{ width:112, height:5, borderRadius:999, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${intensity}%`,
                    background:"linear-gradient(90deg, #10b981, #fbbf24, #ef4444)", transition:"width 0.1s" }} />
                </div>
                <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:9, color:T.slate400 }}>{intensity}% · {stage}</span>
              </div>
              {/* arc + year nodes */}
              <div style={{ position:"absolute", bottom:8, left:0, right:0, display:"flex", justifyContent:"center" }}>
                <div style={{ position:"relative", width:"92%", maxWidth:380, height:60 }}>
                  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} viewBox="0 0 400 64" preserveAspectRatio="none">
                    <path d="M10,54 Q200,-6 390,54" fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="2" />
                  </svg>
                  {YEAR_NODES.map(({ year, left, top }) => {
                    const active = year === nearest;
                    return (
                      <button key={year} type="button" onClick={() => setVal(year)}
                        style={{ position:"absolute", left, top, transform:`translateX(-50%) scale(${active?1.1:1})`,
                          background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                        <span style={{ width:12, height:12, borderRadius:"50%", display:"block",
                          background: active ? T.cyan : "rgba(255,255,255,0.18)",
                          border: `1px solid ${active ? T.cyan : "rgba(255,255,255,0.28)"}`,
                          boxShadow: active ? `0 0 10px ${T.cyan}` : "none", }} />
                        <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:10,
                          color: year===2025&&!active ? "#f87171" : active ? T.cyan : T.slate500,
                          fontWeight: year===2025 ? 700 : 400 }}>{year}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* slider */}
            <div style={{ background:"rgba(5,10,25,0.7)", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:14, padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
              <input type="range" min={2021} max={2025} step={0.05} value={val}
                onChange={e => setVal(parseFloat(e.target.value))}
                style={{ width:"100%", height:5, borderRadius:999, accentColor:T.cyan, cursor:"pointer" }} />
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:11, color:T.slate500 }}>Pristine 2021</span>
                <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:11, color:T.cyan }}>+{velocity} m²/yr</span>
                <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:11, color:"#f87171", fontWeight:700 }}>Critical 2025</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Case details */}
          <motion.div className="glass-panel" whileHover={{ boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}
            style={{ borderRadius:20, padding:24, display:"flex", flexDirection:"column", justifyContent:"space-between", gap:20,
              background:"rgba(13,20,40,0.72)" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                paddingBottom:14, borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <FileText size={18} color={T.cyan} />
                  <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:17, color:T.slate100, fontWeight:700 }}>Case Details</span>
                </div>
                <StatusPill label="High Priority" colors={T.sevHigh} />
              </div>
              <div style={{ display:"flex", flexDirection:"column" }}>
                {[
                  ["Case ID",        "UC-2025-0894",                       true,  T.slate100],
                  ["Location",       "Gangapur Road, Nashik",              false, T.slate200],
                  ["Latitude",       "20.0124° N",                         true,  T.cyan],
                  ["Longitude",      "73.7548° E",                         true,  T.cyan],
                  ["Protected Zone", "River Buffer Zone (100m)",            false, "#fbbf24"],
                  ["Detected Year",  "2024 – 2025 Incursion",              true,  T.slate200],
                  ["Confidence",     "97% Corroborated",                   true,  "#34d399"],
                  ["Area Affected",  "420 m²",                             true,  "#f87171"],
                  ["Detected Change","New Commercial Plinth Footprint",    false, T.slate200],
                ].map(([label, value, mono, color]) => (
                  <div key={String(label)} style={{ display:"flex", justifyContent:"space-between",
                    padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", gap:12 }}>
                    <span style={{ fontSize:12, color:T.slate500 }}>{label}</span>
                    <span style={{ fontFamily: mono ? "var(--font-mono,monospace)" : "inherit",
                      fontSize:12, color:String(color), fontWeight:600, textAlign:"right" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <motion.button type="button" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                style={{ flex:1, padding:"10px 0", borderRadius:12, border:"1px solid rgba(52,211,153,0.4)",
                  background:"rgba(52,211,153,0.1)", color:"#34d399", cursor:"pointer",
                  fontFamily:"var(--font-mono,monospace)", fontSize:12, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <CheckCircle2 size={14}/> Mark Reviewed
              </motion.button>
              <motion.button type="button" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                style={{ flex:1, padding:"10px 0", borderRadius:12, border:"1px solid rgba(248,113,113,0.4)",
                  background:"rgba(248,113,113,0.1)", color:"#f87171", cursor:"pointer",
                  fontFamily:"var(--font-mono,monospace)", fontSize:12, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <Flag size={14}/> Flag for Action
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 4 · AI Legal Notice ──────────────────────────────────────────────

function AILegalNotice() {
  const steps = [
    { label:"Preparing satellite evidence...",  done:true  },
    { label:"Collecting GPS coordinates...",    done:true  },
    { label:"Compiling multi-year timeline...", done:true  },
    { label:"Generating official notice...",    done:false },
  ];

  return (
    <section>
      <SectionDivider label="AI Complaint Letter Generator" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <EyebrowLabel><ShieldAlert size={13} /> AI Complaint Letter Generator</EyebrowLabel>
          <SectionTitle>Auto-Generated Legal Notice</SectionTitle>
        </div>

        <motion.div className="glass-panel" whileHover={{ boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}
          style={{ borderRadius:20, padding:24, display:"flex", flexWrap:"wrap", gap:24,
            background:"rgba(13,20,40,0.72)" }}>
          {/* pipeline */}
          <div style={{ flex:"1 1 240px", minWidth:220, display:"flex", flexDirection:"column", justifyContent:"space-between", gap:16,
            background:"rgba(5,10,25,0.7)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:18 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"0.65rem", textTransform:"uppercase",
                letterSpacing:"0.15em", color:T.slate500, fontWeight:600 }}>Automated Compilation Pipeline</span>
              {steps.map(s => (
                <div key={s.label} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                  borderRadius:10, border:`1px solid ${s.done ? "rgba(52,211,153,0.25)" : "rgba(34,211,238,0.3)"}`,
                  background: s.done ? "rgba(52,211,153,0.07)" : "rgba(34,211,238,0.1)" }}>
                  {s.done
                    ? <CheckCircle2 size={17} color="#34d399" style={{ flexShrink:0 }} />
                    : <motion.div animate={{ rotate: 360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}>
                        <RefreshCw size={17} color={T.cyan} style={{ flexShrink:0 }} />
                      </motion.div>
                  }
                  <span style={{ fontSize:12, color: s.done ? T.slate300 : T.cyan, fontWeight: s.done ? 500 : 600 }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, padding:"10px 12px", borderRadius:10,
              background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.1)",
              fontSize:11, color:T.slate400, alignItems:"flex-start" }}>
              <ShieldAlert size={14} color={T.cyan} style={{ flexShrink:0, marginTop:1 }} />
              <span>Digital seal cryptographically attached to Section 53 MRTP Act statutory complaint.</span>
            </div>
          </div>

          {/* white paper notice */}
          <div style={{ flex:"2 1 340px", background:"#fff", borderRadius:14, padding:28,
            color:"#1e293b", boxShadow:"0 4px 24px rgba(0,0,0,0.35)", position:"relative", overflow:"hidden" }}>
            {/* watermark */}
            <div style={{ position:"absolute", right:-30, bottom:-30, opacity:0.04, color:"#1e293b", pointerEvents:"none", userSelect:"none" }}>
              <ShieldAlert size={200} />
            </div>
            <div style={{ paddingBottom:14, marginBottom:14, borderBottom:"2px solid #1e293b",
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <ShieldAlert size={32} color="#1e293b" />
                <div>
                  <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(12px,1.5vw,15px)",
                    textTransform:"uppercase", letterSpacing:"-0.01em", color:"#1e293b" }}>Nashik Municipal Corporation</div>
                  <div style={{ fontSize:11, color:"#475569" }}>Town Planning &amp; Encroachment Removal Department</div>
                </div>
              </div>
              <div style={{ fontFamily:"monospace", fontSize:10, color:"#475569", textAlign:"right" }}>
                <div>REF: NMC/TPD/2025/0894</div>
                <div>DATE: 18 SEP 2025</div>
              </div>
            </div>
            <h5 style={{ textAlign:"center", fontWeight:700, fontSize:"clamp(10px,1.2vw,12px)",
              textTransform:"uppercase", letterSpacing:"0.06em", textDecoration:"underline",
              color:"#1e293b", marginBottom:12 }}>
              NOTICE OF UNAUTHORIZED CONSTRUCTION UNDER SECTION 53, MRTP ACT, 1966
            </h5>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, background:"#f1f5f9",
              padding:10, borderRadius:6, fontFamily:"monospace", fontSize:11, color:"#1e293b", marginBottom:12 }}>
              <div><strong>Case ID:</strong> UC-2025-0894</div>
              <div><strong>Location:</strong> Gangapur Rd, Plot 4A</div>
              <div><strong>Coordinates:</strong> 20.0124°N, 73.7548°E</div>
              <div><strong>Violation:</strong> −18.4m inside 100m River Setback</div>
            </div>
            <p style={{ fontSize:12, color:"#475569", lineHeight:1.7, marginBottom:8 }}>
              This is to formally notify that an unauthorized commercial foundation footprint of approximately{" "}
              <strong>420 sq. meters</strong> has been detected through multispectral satellite telemetry and verified by
              designated Ward 4 inspectors. The construction directly infringes upon the statutory Godavari River riparian green corridor.
            </p>
            <p style={{ fontSize:12, color:"#475569", lineHeight:1.7, marginBottom:16 }}>
              You are hereby commanded to halt all ongoing masonry and excavation operations immediately and show cause within{" "}
              <strong>48 hours</strong> of service, failing which summary demolition will proceed under Municipal Code.
            </p>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between",
              paddingTop:12, borderTop:"1px solid #e2e8f0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <CheckCircle2 size={16} color="#047857" />
                <span style={{ fontFamily:"monospace", fontSize:10, color:"#475569" }}>Digital Signature ID: #NK-9921-VERIFIED</span>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:12, fontWeight:700, color:"#1e293b" }}>Municipal Commissioner</div>
                <div style={{ fontSize:10, color:"#64748b" }}>Nashik Municipal Corporation</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 5 · Case Package Export ─────────────────────────────────────────

function CaseExport() {
  return (
    <section>
      <SectionDivider label="Report Generation and Export" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <EyebrowLabel><Download size={13} /> Report Generation and Export</EyebrowLabel>
          <SectionTitle>Case Package Ready</SectionTitle>
        </div>

        <motion.div className="glass-panel" whileHover={{ boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}
          style={{ borderRadius:20, padding:"24px 28px", display:"flex", flexWrap:"wrap",
            alignItems:"center", justifyContent:"space-between", gap:24,
            background:"rgba(13,20,40,0.72)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:14, flexShrink:0,
              background:"rgba(34,211,238,0.08)", border:"1px solid rgba(34,211,238,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center", color:T.cyan,
              boxShadow:"0 0 20px rgba(34,211,238,0.15)" }}>
              <Download size={26} />
            </div>
            <div>
              <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"clamp(15px,2vw,18px)",
                color:T.slate100, fontWeight:700 }}>Case Package #UC-2025-0894 Ready</div>
              <div style={{ fontSize:12, color:T.slate500, marginTop:3 }}>
                Includes high-res Sentinel-2 orthomosaic captures, timeline telemetry, and Section 53 MRTP statutory notice.
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <OutlineBtn icon={<Printer size={16}/>}>Print Notice</OutlineBtn>
            <PrimaryBtn icon={<Download size={16}/>}>Export Official Case PDF</PrimaryBtn>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer (identical to citizen DashboardFooter) ────────────────────────────

function MunicipalFooter() {
  return (
    <footer className="cs-footer">
      <div className="cs-footer-inner">
        <div className="cs-footer-brand">
          <BarChart3 className="h-4 w-4 text-cyan-500" />
          <span className="text-slate-300 font-medium">UrbanCore</span>
          <span className="cs-footer-sep">|</span>
          <span className="text-slate-500">Municipal Citizen Intelligence</span>
        </div>
        <nav className="cs-footer-links">
          <a href="#" className="cs-footer-link">Privacy Policy</a>
          <span className="cs-footer-dot">|</span>
          <a href="#" className="cs-footer-link">Terms of Use</a>
          <span className="cs-footer-dot">|</span>
          <a href="#" className="cs-footer-link">Contact NMC</a>
        </nav>
      </div>
      <style>{`
        .cs-footer { width:100%; border-top:1px solid rgba(255,255,255,0.06); padding:22px 0; margin-top:12px; }
        .cs-footer-inner { max-width:1280px; margin:0 auto; padding:0 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
        .cs-footer-brand { display:flex; align-items:center; gap:8px; font-size:0.8125rem; }
        .cs-footer-sep { color:rgba(255,255,255,0.18); }
        .cs-footer-links { display:flex; align-items:center; gap:8px; }
        .cs-footer-link { font-size:0.75rem; color:#334155; text-decoration:none; transition:color 0.15s; }
        .cs-footer-link:hover { color:#94a3b8; }
        .cs-footer-dot { font-size:0.75rem; color:rgba(255,255,255,0.12); }
        @media (max-width:640px) { .cs-footer-inner { flex-direction:column; align-items:flex-start; } }
      `}</style>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function MunicipalGISDashboard({ onBack }: { onBack?: () => void }) {
  const threeRef = useRef<HTMLDivElement>(null);
  useThreeScene(threeRef);

  return (
    <div style={{
      position:"fixed", inset:0, overflowY:"auto", overflowX:"hidden",
      background:"var(--color-background, oklch(0.16 0.008 250))",
      color:"var(--color-foreground, #f8fafc)",
      fontFamily:"var(--font-sans,'Manrope',sans-serif)",
    }}>
      {/* Three.js background */}
      <div ref={threeRef} style={{ position:"fixed", inset:0, zIndex:0, opacity:0.55, pointerEvents:"none" }} />

      {/* Subtle vignette to keep text readable over the 3D scene */}
      <div style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none",
        background:"radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(5,8,18,0.75) 100%)" }} />

      {/* Ambient telemetry overlays (matching reference, using citizen muted colors) */}
      <div style={{ position:"fixed", top:96, left:28, zIndex:2, pointerEvents:"none",
        display:"flex", flexDirection:"column", gap:4,
        fontFamily:"var(--font-mono,monospace)", fontSize:10, color:"rgba(51,65,85,0.9)" }}>
        {["ORBITAL_ID: SENTINEL-2B // POL-SAR 4K","COORD: 20.0050° N, 73.7800° E • ELEV 584M","SYNCHRONIZATION: LIVE LOCK 99.8%"].map(s=><span key={s}>{s}</span>)}
      </div>
      <div style={{ position:"fixed", bottom:28, right:28, zIndex:2, pointerEvents:"none",
        display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4,
        fontFamily:"var(--font-mono,monospace)", fontSize:10, color:"rgba(51,65,85,0.9)" }}>
        {["EPHEMERIS: AZ 142.4° • EL 68.2°","BAND: SAR C-BAND POLARIMETRIC","GODAVARI RIVER BASIN SECTOR 04"].map(s=><span key={s}>{s}</span>)}
      </div>

      {/* sticky nav bar — matching citizen RoleNavigation style */}
      <header style={{
        position:"sticky", top:0, zIndex:40, width:"100%",
        background:"rgba(0,0,0,0.6)", backdropFilter:"blur(12px)",
        borderBottom:"1px solid rgba(255,255,255,0.1)",
        padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 1px 0 rgba(255,255,255,0.04)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <motion.button type="button" onClick={onBack} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            style={{ width:36, height:36, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.15)",
              background:"rgba(255,255,255,0.05)", color:"#cbd5e1", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ArrowLeft size={16} />
          </motion.button>
          <div style={{ width:1, height:20, background:"rgba(255,255,255,0.1)" }} />
          <div style={{ width:32, height:32, borderRadius:"50%", border:"1px solid rgba(34,211,238,0.4)",
            background:"rgba(34,211,238,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:T.cyan }}>
            <ShieldAlert size={15} />
          </div>
          <div>
            <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:14, fontWeight:600,
              letterSpacing:"0.04em", color:"#fff" }}>Municipal Authority</div>
            <div style={{ fontSize:11, color:"#64748b" }}>UrbanCore GIS Workspace</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8,
          border:"1px solid rgba(34,211,238,0.3)", background:"rgba(34,211,238,0.1)",
          borderRadius:999, padding:"6px 10px 6px 6px" }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(34,211,238,0.2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"var(--font-mono,monospace)", fontSize:11, fontWeight:700, color:T.cyan, textTransform:"uppercase" }}>RD</div>
          <span style={{ fontSize:12, fontWeight:500, color:"#e2e8f0" }}>Insp. Rajesh Deshmukh</span>
          <span style={{ fontSize:11, color:"#64748b" }}>· NMC</span>
        </div>
      </header>

      {/* page content — matching citizen cs-content / cs-page layout */}
      <div style={{ position:"relative", zIndex:10 }}>
        <div style={{
          maxWidth:1280, margin:"0 auto", padding:"24px 24px 0",
          display:"flex", flexDirection:"column", gap:48,
        }}>
          <DistrictMap />
          <PriorityQueue />
          <CaseForensics />
          <AILegalNotice />
          <CaseExport />
        </div>
        <MunicipalFooter />
      </div>
    </div>
  );
}
