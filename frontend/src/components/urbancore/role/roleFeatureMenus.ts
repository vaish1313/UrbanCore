import {
  Compass,
  SlidersHorizontal,
  Activity,
  AlertTriangle,
  TrendingUp,
  FileText,
  Eye,
  History,
} from "lucide-react";
import type { RoleFeatureMenuItem } from "./RoleFeaturesDropdown";

export const BUILDER_FEATURE_MENU: RoleFeatureMenuItem[] = [
  { id: "suitability", label: "AI Land Suitability Score", icon: SlidersHorizontal },
  { id: "terrain",     label: "Site Readiness Analysis",  icon: Activity },
  { id: "constraints", label: "Zoning Check",             icon: AlertTriangle },
  { id: "history",     label: "Construction History",      icon: History },
  { id: "risk",        label: "Neighbourhood Comparison", icon: TrendingUp },
];

export const MUNICIPAL_FEATURE_MENU: RoleFeatureMenuItem[] = [
  { id: "overview", label: "Nashik District Map", icon: Compass },
  { id: "case-detail", label: "Case Detail", icon: Eye },
  { id: "complaints", label: "Citizen Complaints", icon: FileText },
];
