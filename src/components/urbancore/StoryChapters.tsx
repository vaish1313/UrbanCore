export type Beat = {
  lines: readonly string[];
  tone?: "default" | "accent" | "stack";
};

export type Chapter = {
  eyebrow: string;
  beats: readonly Beat[];
};

/** Scroll chapters after the camera has arrived over Nashik. */
export const CHAPTERS: readonly Chapter[] = [
  {
    eyebrow: "Satellite imagery",
    beats: [
      { lines: ["Every city", "tells a story."] },
      { lines: ["We're learning", "how to read it."] },
    ],
  },
  {
    eyebrow: "Digital twin",
    beats: [{ lines: ["The city,", "rebuilt as data."] }],
  },
  {
    eyebrow: "Multi-year construction monitoring",
    beats: [
      { lines: ["Cities never", "stay still."] },
      { lines: ["Urban growth", "leaves a trace."] },
    ],
  },
  {
    eyebrow: "Terrain intelligence",
    beats: [
      { lines: ["Land is more", "than a location."] },
      { lines: ["A shape.", "A slope.", "A risk."], tone: "stack" },
    ],
  },
  {
    eyebrow: "Environmental & regulatory constraints",
    beats: [
      { lines: ["Where can we build?"] },
      { lines: ["Where should we not?"] },
      { lines: ["What are we overlooking?"] },
    ],
  },
  {
    eyebrow: "Layered geospatial datasets",
    beats: [{ lines: ["One city.", "Seven truths."] }],
  },
  {
    eyebrow: "Land suitability",
    beats: [
      { lines: ["Land is not just", "where you build."] },
      { lines: ["It's whether", "you should."] },
    ],
  },
  {
    eyebrow: "AI decision support",
    beats: [{ lines: ["Raw data"] }, { lines: ["Patterns"] }, { lines: ["Context"] }, { lines: ["Intelligence"] }],
  },
];

export const AWAKENING = [
  "Understanding urban growth...",
  "Evaluating terrain...",
  "Checking environmental constraints...",
  "Mapping development patterns...",
  "Urban intelligence ready.",
] as const;
