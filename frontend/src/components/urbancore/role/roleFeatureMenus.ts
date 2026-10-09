import {
  Compass,
  SlidersHorizontal,
  Activity,
  AlertTriangle,
  TrendingUp,
  FileText,
  Satellite,
  Flag,
  Eye,
} from "lucide-react";
import type { RoleFeatureMenuItem } from "./RoleFeaturesDropdown";

export const BUILDER_FEATURE_MENU: RoleFeatureMenuItem[] = [
  { id: "suitability", label: "AI Land Suitability Score", icon: SlidersHorizontal },
  { id: "terrain",     label: "Site Readiness Analysis",  icon: Activity },
  { id: "constraints", label: "Zoning Check",             icon: AlertTriangle },
  { id: "risk",        label: "Neighbourhood Comparison", icon: TrendingUp },
];

export const MUNICIPAL_FEATURE_MENU: RoleFeatureMenuItem[] = [
  { id: "overview", label: "Command Overview", icon: Compass },
  { id: "district-map", label: "District Map", icon: Satellite },
  { id: "encroachment", label: "Encroachment Watch", icon: Flag },
  { id: "case-detail", label: "Case Detail", icon: Eye },
  { id: "complaints", label: "Citizen Complaints", icon: FileText },
];
