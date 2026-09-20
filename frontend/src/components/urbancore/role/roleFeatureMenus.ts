import {
  Compass,
  SlidersHorizontal,
  Activity,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  FileText,
  Satellite,
  Flag,
  Eye,
  ShieldAlert,
  Download,
  Flame,
} from "lucide-react";
import type { RoleFeatureMenuItem } from "./RoleFeaturesDropdown";

export const BUILDER_FEATURE_MENU: RoleFeatureMenuItem[] = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "suitability", label: "Land Suitability", icon: SlidersHorizontal },
  { id: "terrain", label: "Terrain Analysis", icon: Activity },
  { id: "constraints", label: "Zoning & Constraints", icon: AlertTriangle },
  { id: "history", label: "Construction History", icon: TrendingUp },
  { id: "risk", label: "Risk Assessment", icon: ShieldCheck },
  { id: "reports", label: "Land Reports", icon: FileText, isReportModalTrigger: true },
];

export const MUNICIPAL_FEATURE_MENU: RoleFeatureMenuItem[] = [
  { id: "overview", label: "Command Overview", icon: Compass },
  { id: "district-map", label: "District Map", icon: Satellite },
  { id: "encroachment", label: "Encroachment Watch", icon: Flag },
  { id: "forensics", label: "Case Forensics", icon: Eye },
  { id: "heatmap", label: "Construction Heatmap", icon: Flame },
  { id: "legal", label: "AI Legal Notice", icon: ShieldAlert },
  { id: "export", label: "Case Export", icon: Download },
  { id: "compliance", label: "Compliance Draft", icon: FileText, isReportModalTrigger: true },
];
