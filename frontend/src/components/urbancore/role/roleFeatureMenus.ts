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
  { id: "overview",      label: "Command Overview",    icon: Compass },
  { id: "district-map",  label: "District Map",        icon: Satellite },
  { id: "encroachment",  label: "Encroachment Watch",  icon: Flag },
  { id: "case-detail",   label: "Case Detail",         icon: Eye },
  { id: "complaints",    label: "Citizen Complaints",  icon: FileText },
];
