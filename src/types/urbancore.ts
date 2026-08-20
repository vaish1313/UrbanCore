export type RoleType = "builder" | "municipal" | "citizen" | null;

export type AOI = {
  id: string;
  name: string;
  category: "residential" | "commercial" | "industrial" | "protected" | "highway" | "dam";
  coords: { lat: number; lng: number; x: number; y: number };
  suitabilityScore: number;
  terrain: {
    elevation: number;
    slope: number;
    roughness: string;
    flatLandPercent: number;
    readiness: "HIGH" | "MEDIUM" | "LOW";
  };
  accessibilityScore: number;
  waterAvailabilityScore: number;
  environmentalRiskScore: number;
  developmentPotentialScore: number;
  constructionHistory: {
    year: number;
    buildingsCount: number;
    builtUpChangePercent: number;
  }[];
  constraints: {
    floodZoneOverlapPercent: number;
    forestBoundaryOverlapPercent: number;
    greenBeltOverlapPercent: number;
    protectedAreaOverlapPercent: number;
    environmentalRestriction: "Low" | "Moderate" | "High" | "Critical";
  };
  summary: string;
};

export type MunicipalAlert = {
  id: string;
  title: string;
  location: string;
  aoiId: string;
  category: "River / Flood" | "Forest" | "Green Belt" | "Protected Zone";
  severity: "HIGH" | "MEDIUM" | "LOW";
  detectedYear: number;
  affectedAreaSqM: number;
  status: "Needs Review" | "Under Investigation" | "Notice Issued" | "Resolved";
  coords: { x: number; y: number };
  evidence: {
    beforeImage: string;
    afterImage: string;
    buildingFootprint: string;
    gpsCoords: string;
    satelliteSensor: string;
    detectionDate: string;
  };
  description: string;
};

export type BuildingDetection = {
  id: string;
  location: string;
  aoiId: string;
  storeys: number;
  firstDetectedYear: number;
  latestDetectedYear: number;
  builtUpAreaSqM: number;
  nearbyProtectedZone: string;
  status: "Existing" | "Newly Detected" | "Changed" | "Under Review";
  coords: { x: number; y: number };
};

export type CitizenReport = {
  id: string;
  referenceNumber: string;
  location: string;
  concernType: "Possible illegal construction" | "River / waterbody concern" | "Green area concern" | "Environmental concern" | "Other";
  description: string;
  submittedAt: string;
  status: "Pending Review" | "Verified" | "Action Taken";
  contactName?: string;
  contactEmail?: string;
};

export type SpatialLayerState = {
  satellite: boolean;
  buildings: boolean;
  roads: boolean;
  terrain: boolean;
  river: boolean;
  floodZone: boolean;
  forest: boolean;
  greenBelt: boolean;
  protectedZones: boolean;
  constructionChange: boolean;
};
