export type ComparisonPreset = {
  areaA: string;
  areaB: string;
  metrics: {
    label: string;
    valueA: string | number;
    valueB: string | number;
    winner: "A" | "B" | "TIE";
  }[];
};

export const BUILDER_COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    areaA: "gangapur-road",
    areaB: "pathardi-phata",
    metrics: [
      { label: "Suitability Score", valueA: 82, valueB: 88, winner: "B" },
      { label: "Flat Land %", valueA: "74%", valueB: "91%", winner: "B" },
      { label: "Average Slope", valueA: "8.4°", valueB: "4.2°", winner: "B" },
      { label: "Road Access", valueA: 91, valueB: 94, winner: "B" },
      { label: "Flood Risk Overlap", valueA: "12%", valueB: "0%", winner: "B" },
      { label: "5-Yr Growth Rate", valueA: "+36.6%", valueB: "+114.2%", winner: "B" },
      { label: "Environmental Risk", valueA: "Moderate", valueB: "Low", winner: "B" },
    ],
  },
  {
    areaA: "cidco",
    areaB: "satpur-midc",
    metrics: [
      { label: "Suitability Score", valueA: 79, valueB: 76, winner: "A" },
      { label: "Flat Land %", valueA: "86%", valueB: "82%", winner: "A" },
      { label: "Average Slope", valueA: "5.1°", valueB: "6.8°", winner: "A" },
      { label: "Road Access", valueA: 88, valueB: 89, winner: "B" },
      { label: "Flood Risk Overlap", valueA: "2%", valueB: "5%", winner: "A" },
      { label: "5-Yr Growth Rate", valueA: "+20.0%", valueB: "+27.5%", winner: "B" },
      { label: "Environmental Risk", valueA: "Low", valueB: "Moderate", winner: "A" },
    ],
  },
];

export const MOCK_BUILDER_REPORT_DATA = {
  title: "LAND INTELLIGENCE REPORT",
  generatedDate: "2026-08-20",
  sensorData: "Sentinel-2 L2A · SRTM 30m DEM · U-Net + SAM Model v4.2",
  disclaimer: "AI-GENERATED DECISION SUPPORT REPORT — REQUIRES OFFICIAL MUNICIPAL VERIFICATION & LEGAL SURVEY",
};
