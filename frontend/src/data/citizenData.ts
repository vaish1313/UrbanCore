import type { CitizenReport } from "@/types/urbancore";

export const INITIAL_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: "rep-001",
    referenceNumber: "UC-2026-00482",
    location: "Panchavati near Godavari Ramkund",
    concernType: "Possible illegal construction",
    description: "Concrete pillars being erected close to the riverbank line inside the prohibited buffer zone.",
    submittedAt: "2026-08-14",
    status: "Pending Review",
    contactName: "Aarav Sharma",
  },
  {
    id: "rep-002",
    referenceNumber: "UC-2026-00391",
    location: "Gangapur Road near Anandwalli",
    concernType: "Green area concern",
    description: "Tree clearing noticed along green belt plot near river tributary.",
    submittedAt: "2026-08-02",
    status: "Verified",
    contactName: "Priya Kulkarni",
  },
  {
    id: "rep-003",
    referenceNumber: "UC-2026-00214",
    location: "Pathardi Phata Highway Junction",
    concernType: "Environmental concern",
    description: "Uncontrolled soil tipping blocking drainage natural storm outlet.",
    submittedAt: "2026-07-19",
    status: "Action Taken",
    contactName: "Rahul Patil",
  },
];

export const CITIZEN_NEIGHBORHOOD_STORIES = [
  {
    id: "panchavati",
    neighborhood: "Panchavati & Godavari Banks",
    summary: "Heritage and river corridor. 12% increase in built structures since 2021 with heightened focus on riverbank green protection.",
    greeneryTrend: "Stable (-2%)",
    constructionTrend: "Moderate growth (+12%)",
    waterIndex: "High river presence",
  },
  {
    id: "gangapur-road",
    neighborhood: "Gangapur Road Belt",
    summary: "Active residential transformation. 52 new housing structures detected since 2021 with 74% flat-land availability.",
    greeneryTrend: "Moderate drop (-6%)",
    constructionTrend: "High growth (+36.6%)",
    waterIndex: "Canal & dam downstream proximity",
  },
  {
    id: "pathardi-phata",
    neighborhood: "Pathardi Phata & Mumbai Highway",
    summary: "Fastest growing urban corridor in Nashik. Built-up footprint doubled between 2021 and 2025.",
    greeneryTrend: "Significant change (-14%)",
    constructionTrend: "Rapid growth (+114.2%)",
    waterIndex: "Low flood risk",
  },
  {
    id: "cidco",
    neighborhood: "CIDCO & Ambad Link",
    summary: "Well-established residential & commercial hub. High density redevelopment with low environmental constraints.",
    greeneryTrend: "Preserved canopy",
    constructionTrend: "Steady infill (+20.0%)",
    waterIndex: "Municipal supply managed",
  },
];
