// ─── Citizen Workspace Mock Data ─────────────────────────────────────────────
// All data is backend-ready: replace mock fetch calls with real API endpoints.

// ── User Profile ──────────────────────────────────────────────────────────────
export const CITIZEN_USER = {
  name: "Purva Mankar",
  email: "purva.mankar@nashikcitizen.gov.in",
  avatar: "P",
  role: "General Citizen",
  notifications: 3,
};

// ── Search ────────────────────────────────────────────────────────────────────
export const POPULAR_SEARCHES = [
  { label: "Gangapur Road", type: "Residential Area", lat: 20.0059, lng: 73.7912 },
  { label: "Panchavati", type: "Heritage & Riverfront", lat: 20.0120, lng: 73.7891 },
  { label: "Pathardi Phata", type: "Developing Zone", lat: 19.9780, lng: 73.8150 },
  { label: "Nashik Road", type: "Industrial Corridor", lat: 19.9800, lng: 73.8200 },
  { label: "CIDCO Nashik", type: "Planned Township", lat: 20.0020, lng: 73.7850 },
];

export const RECENT_SEARCHES_KEY = "uc_citizen_recent_searches";

export const SEARCH_SUGGESTIONS = [
  { label: "Gangapur Road, Plot 4A", type: "Address", lat: 20.0059, lng: 73.7912 },
  { label: "Gangapur Village", type: "Village", lat: 20.0090, lng: 73.7930 },
  { label: "Panchavati Sector", type: "Locality", lat: 20.0120, lng: 73.7891 },
  { label: "Pathardi Phata", type: "Developing Zone", lat: 19.9780, lng: 73.8150 },
  { label: "422001", type: "PIN Code", lat: 19.9975, lng: 73.7898 },
  { label: "Nashik Road", type: "Industrial Area", lat: 19.9800, lng: 73.8200 },
  { label: "Godavari Riverbank, Sec 2", type: "Zone", lat: 20.0140, lng: 73.7760 },
  { label: "CIDCO Ambad", type: "Planned Township", lat: 20.0020, lng: 73.7850 },
];

// ── Map / Location ─────────────────────────────────────────────────────────────
export type MapMarker = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  x: number; // 0-100% canvas position
  y: number;
  color: "orange" | "teal" | "cyan" | "red";
};

export const DEFAULT_MARKERS: MapMarker[] = [
  { id: "m1", label: "Selected Location", lat: 20.0059, lng: 73.7912, x: 29, y: 41, color: "orange" },
  { id: "m2", label: "Another Location", lat: 20.0120, lng: 73.7891, x: 63, y: 57, color: "teal" },
];

export type LocationInfo = {
  village: string;
  taluka: string;
  district: string;
  state?: string;
  pincode?: string;
  lat: number;
  lng: number;
  elevation: number;
  selectedTime: string;
  protection: string;
  protectionLevel: "safe" | "caution" | "danger";
};

export const DEFAULT_LOCATION: LocationInfo = {
  village: "Gangapur Village",
  taluka: "Nashik",
  district: "Nashik",
  lat: 20.0059,
  lng: 73.7912,
  elevation: 565,
  selectedTime: "Sep 17, 2026 · 23:35 IST",
  protection: "No protected zone constraints.",
  protectionLevel: "safe",
};

export const PINNED_LOCATION: LocationInfo = {
  village: "Custom Pinned Location",
  taluka: "Nashik",
  district: "Nashik",
  lat: 20.0123,
  lng: 73.7891,
  elevation: 572,
  selectedTime: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
  protection: "No protected zone constraints.",
  protectionLevel: "safe",
};

// ── Property Analysis Metrics ─────────────────────────────────────────────────
export type PropertyMetric = {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  unit: string;
  max: number;
  icon: string; // lucide icon name
  status: "good" | "moderate" | "poor";
  statusLabel: string;
  tooltip: string;
  color: string;
};

export const PROPERTY_METRICS: PropertyMetric[] = [
  {
    id: "green-cover",
    label: "Green Cover",
    value: 34,
    displayValue: "34",
    unit: "%",
    max: 100,
    icon: "Trees",
    status: "moderate",
    statusLabel: "Moderate",
    tooltip: "Percentage of vegetated land within 500m radius",
    color: "#22c55e",
  },
  {
    id: "builtup-density",
    label: "Built-up Density",
    value: 62,
    displayValue: "62",
    unit: "%",
    max: 100,
    icon: "Building2",
    status: "moderate",
    statusLabel: "High",
    tooltip: "Proportion of land covered by structures",
    color: "#f59e0b",
  },
  {
    id: "water-bodies",
    label: "Nearby Water Bodies",
    value: 3,
    displayValue: "3",
    unit: " bodies",
    max: 10,
    icon: "Droplets",
    status: "good",
    statusLabel: "Available",
    tooltip: "Number of water bodies within 2km",
    color: "#06b6d4",
  },
  {
    id: "terrain-slope",
    label: "Terrain Slope",
    value: 4,
    displayValue: "4",
    unit: "°",
    max: 45,
    icon: "Mountain",
    status: "good",
    statusLabel: "Flat",
    tooltip: "Average terrain gradient — lower is better for construction",
    color: "#a78bfa",
  },
  {
    id: "elevation",
    label: "Elevation",
    value: 565,
    displayValue: "565",
    unit: "m",
    max: 1200,
    icon: "ArrowUpFromLine",
    status: "good",
    statusLabel: "Stable",
    tooltip: "Mean elevation above sea level",
    color: "#38bdf8",
  },
  {
    id: "road-connectivity",
    label: "Road Connectivity",
    value: 88,
    displayValue: "88",
    unit: "%",
    max: 100,
    icon: "Route",
    status: "good",
    statusLabel: "Excellent",
    tooltip: "Proximity and density of road networks",
    color: "#34d399",
  },
  {
    id: "construction-activity",
    label: "Construction Activity",
    value: 71,
    displayValue: "+14.2",
    unit: "%",
    max: 100,
    icon: "HardHat",
    status: "moderate",
    statusLabel: "Active",
    tooltip: "Construction growth rate since 2021",
    color: "#fb923c",
  },
  {
    id: "env-sensitivity",
    label: "Environmental Sensitivity",
    value: 28,
    displayValue: "28",
    unit: "/100",
    max: 100,
    icon: "Leaf",
    status: "good",
    statusLabel: "Low Risk",
    tooltip: "Overall environmental impact risk score",
    color: "#86efac",
  },
];

export const OVERALL_SCORE = 92;

// ── Construction Timeline ─────────────────────────────────────────────────────
export const TIMELINE_YEARS = [2021, 2022, 2023, 2024, 2025];

export type TimelineYearData = {
  year: number;
  buildingCount: number;
  builtUpChange: number; // %
  greenCover: number; // %
  roadsKm: number;
  description: string;
};

export const TIMELINE_DATA: Record<number, TimelineYearData> = {
  2021: { year: 2021, buildingCount: 142, builtUpChange: 0, greenCover: 41, roadsKm: 38, description: "Baseline year. Predominantly agricultural land with scattered residential clusters." },
  2022: { year: 2022, buildingCount: 168, builtUpChange: 8.2, greenCover: 39, roadsKm: 42, description: "New residential plots approved near Gangapur Dam approach road." },
  2023: { year: 2023, buildingCount: 211, builtUpChange: 22.4, greenCover: 36, roadsKm: 48, description: "Highway expansion triggered rapid commercial development along eastern belt." },
  2024: { year: 2024, buildingCount: 274, builtUpChange: 38.1, greenCover: 34, roadsKm: 53, description: "High-density construction detected near riverbank buffer zones — flagged for review." },
  2025: { year: 2025, buildingCount: 321, builtUpChange: 55.7, greenCover: 31, roadsKm: 58, description: "Continued rapid urbanisation. 3 construction sites under municipal investigation." },
};

// ── AI Report ─────────────────────────────────────────────────────────────────
export type AIReportSection = {
  id: string;
  title: string;
  content: string;
  icon: string;
  sentiment: "positive" | "neutral" | "warning" | "critical";
};

export const AI_REPORT_SECTIONS: AIReportSection[] = [
  {
    id: "overview",
    title: "Overview",
    icon: "BarChart3",
    sentiment: "neutral",
    content: "Gangapur Road locality in Nashik shows significant urban development activity between 2021 and 2025. The area sits at 565m elevation with moderate terrain slope, making it structurally suitable for mixed-use development.",
  },
  {
    id: "construction-growth",
    title: "Construction Growth",
    icon: "TrendingUp",
    sentiment: "warning",
    content: "Built-up footprint has expanded by 55.7% since 2021 — well above the Nashik district average of 18.3%. A total of 179 new structures detected via satellite. 12 structures flagged as potentially unauthorised near buffer zones.",
  },
  {
    id: "green-cover",
    title: "Green Cover Analysis",
    icon: "Trees",
    sentiment: "warning",
    content: "Vegetated area has declined from 41% (2021) to 31% (2025), a loss of approximately 0.4 sq km of green land. This rate exceeds acceptable thresholds under Nashik Municipal Green Policy 2023.",
  },
  {
    id: "water-bodies",
    title: "Nearby Water Bodies",
    icon: "Droplets",
    sentiment: "positive",
    content: "Three water bodies detected within 2km: Gangapur Dam reservoir, Godavari River tributary, and a seasonal nala. Current distance from nearest water edge to the selected plot is 340m — above the mandatory 200m buffer.",
  },
  {
    id: "terrain",
    title: "Terrain & Soil",
    icon: "Mountain",
    sentiment: "positive",
    content: "Average terrain slope of 4° indicates predominantly flat land — ideal for foundation work. Soil classification: Black Cotton Soil (expansive). Engineering precautions recommended for multi-storey construction.",
  },
  {
    id: "risks",
    title: "Possible Risks",
    icon: "AlertTriangle",
    sentiment: "critical",
    content: "• River buffer zone encroachment risk in eastern quadrant\n• Green belt overlap detected in 2 plots (NMC boundary data, 2024)\n• Seasonal flood probability: 12% based on 10-year hydrological data\n• 3 active municipal notices in adjacent ward",
  },
  {
    id: "recommendations",
    title: "AI Recommendations",
    icon: "Sparkles",
    sentiment: "neutral",
    content: "• Verify plot status against latest NMC Town Planning Scheme\n• Commission geo-technical survey before foundation work\n• Maintain minimum 250m buffer from seasonal water channels\n• File construction commencement notice with Nashik Municipal Corporation",
  },
  {
    id: "summary",
    title: "Summary",
    icon: "CheckCircle2",
    sentiment: "positive",
    content: "Location Intelligence Score: 92/100. This location is suitable for regulated development with standard precautions. No critical environmental violations detected for the selected plot. Rapid neighbourhood growth warrants ongoing monitoring.",
  },
];

// ── Citizen Reports ───────────────────────────────────────────────────────────
export type StatusType = "Pending" | "Under Review" | "Resolved" | "Rejected";

export type ReportTimeline = {
  label: string;
  date: string;
  done: boolean;
};

export type CitizenReportFull = {
  id: string;
  refId: string;
  date: string;
  location: string;
  type: string;
  status: StatusType;
  description: string;
  officerRemarks: string;
  timeline: ReportTimeline[];
  evidenceBefore: string;
  evidenceAfter: string;
};

export const MOCK_CITIZEN_REPORTS: CitizenReportFull[] = [
  {
    id: "r1",
    refId: "UC-2026-00482",
    date: "14 Aug 2026",
    location: "Panchavati near Godavari Ramkund",
    type: "Possible illegal construction",
    status: "Under Review",
    description: "Concrete pillars being erected close to the riverbank inside the prohibited 200m buffer zone.",
    officerRemarks: "Site visit scheduled for 18 Sep 2026. Structural measurements underway.",
    timeline: [
      { label: "Submitted", date: "14 Aug 2026", done: true },
      { label: "Acknowledged", date: "15 Aug 2026", done: true },
      { label: "Under Review", date: "20 Aug 2026", done: true },
      { label: "Site Visit", date: "18 Sep 2026", done: false },
      { label: "Resolved", date: "—", done: false },
    ],
    evidenceBefore: "/src/assets/region-maharashtra.jpg",
    evidenceAfter: "/src/assets/city-nashik.jpg",
  },
  {
    id: "r2",
    refId: "UC-2026-00391",
    date: "02 Aug 2026",
    location: "Gangapur Road near Anandwalli",
    type: "Green area concern",
    status: "Resolved",
    description: "Tree clearing noticed along green belt plot near river tributary.",
    officerRemarks: "Trees restored under NMC Green Drive initiative. Case closed.",
    timeline: [
      { label: "Submitted", date: "02 Aug 2026", done: true },
      { label: "Acknowledged", date: "03 Aug 2026", done: true },
      { label: "Under Review", date: "07 Aug 2026", done: true },
      { label: "Action Taken", date: "22 Aug 2026", done: true },
      { label: "Resolved", date: "25 Aug 2026", done: true },
    ],
    evidenceBefore: "/src/assets/region-maharashtra.jpg",
    evidenceAfter: "/src/assets/city-nashik.jpg",
  },
  {
    id: "r3",
    refId: "UC-2026-00214",
    date: "19 Jul 2026",
    location: "Pathardi Phata Highway Junction",
    type: "Environmental concern",
    status: "Resolved",
    description: "Uncontrolled soil tipping blocking drainage natural storm outlet.",
    officerRemarks: "Contractor issued notice. Drainage outlet cleared on 28 Jul 2026.",
    timeline: [
      { label: "Submitted", date: "19 Jul 2026", done: true },
      { label: "Acknowledged", date: "20 Jul 2026", done: true },
      { label: "Under Review", date: "23 Jul 2026", done: true },
      { label: "Action Taken", date: "28 Jul 2026", done: true },
      { label: "Resolved", date: "01 Aug 2026", done: true },
    ],
    evidenceBefore: "/src/assets/region-maharashtra.jpg",
    evidenceAfter: "/src/assets/city-nashik.jpg",
  },
  {
    id: "r4",
    refId: "UC-2026-00105",
    date: "05 Jun 2026",
    location: "Nashik Road Industrial Zone",
    type: "Possible illegal construction",
    status: "Rejected",
    description: "Alleged unauthorised godown construction. Later found to have valid industrial license.",
    officerRemarks: "Construction found compliant with NMC industrial zone regulations. Report rejected.",
    timeline: [
      { label: "Submitted", date: "05 Jun 2026", done: true },
      { label: "Acknowledged", date: "06 Jun 2026", done: true },
      { label: "Under Review", date: "12 Jun 2026", done: true },
      { label: "Verification", date: "20 Jun 2026", done: true },
      { label: "Rejected", date: "25 Jun 2026", done: true },
    ],
    evidenceBefore: "/src/assets/region-maharashtra.jpg",
    evidenceAfter: "/src/assets/city-nashik.jpg",
  },
  {
    id: "r5",
    refId: "UC-2026-00088",
    date: "28 May 2026",
    location: "Godavari Riverbank, Sec 2",
    type: "River / waterbody concern",
    status: "Pending",
    description: "Sand mining activity observed on Godavari riverbed near Panchavati ghat area.",
    officerRemarks: "Report under initial review. No officer assigned yet.",
    timeline: [
      { label: "Submitted", date: "28 May 2026", done: true },
      { label: "Acknowledged", date: "29 May 2026", done: true },
      { label: "Under Review", date: "—", done: false },
      { label: "Action Taken", date: "—", done: false },
      { label: "Resolved", date: "—", done: false },
    ],
    evidenceBefore: "/src/assets/region-maharashtra.jpg",
    evidenceAfter: "/src/assets/city-nashik.jpg",
  },
];
