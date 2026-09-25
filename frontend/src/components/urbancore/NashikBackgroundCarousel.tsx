/**
 * NashikBackgroundCarousel
 *
 * Fixed, full-viewport, pointer-events-none background that infinite-slides
 * through 4 Nashik landmark panoramas.  Zero content, zero UI — purely ambient.
 *
 * Mechanism: 8 slides (4 real + 4 duplicates) stacked vertically in a flex
 * column.  CSS animation translates the track up by exactly 50% (= 4 × 100vh),
 * then resets to 0 — creating a seamless infinite loop with no JS timers.
 *
 * Usage:
 *   import { NashikBackgroundCarousel } from "@/components/urbancore/NashikBackgroundCarousel";
 *   <NashikBackgroundCarousel />
 *   <NashikBackgroundCarousel overlayOpacity={0.82} duration={50} />
 */

import { useEffect, type FC } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LandmarkSlide {
  id: string;
  /** Short label shown bottom-right e.g. "01 // TRIMBAKESHWAR TEMPLE" */
  label: string;
  alt: string;
  imageUrl: string;
}

export interface NashikBackgroundCarouselProps {
  /**
   * Opacity of the dark navy scrim layered over the filmstrip.
   * 0 = fully transparent (landmarks fully visible),
   * 1 = fully opaque (landmarks invisible).
   * Default: 0.55  — keeps landmarks vivid while text remains readable.
   */
  overlayOpacity?: number;
  /**
   * Total duration (seconds) for one full vertical loop across all 4 slides.
   * Lower = faster scroll. Default: 42s
   */
  duration?: number;
  /** Override the default landmark list */
  landmarks?: LandmarkSlide[];
  /** Extra className forwarded to the root wrapper */
  className?: string;
}

// ─── Landmark data — real images from the Stitch reference ───────────────────

const DEFAULT_LANDMARKS: LandmarkSlide[] = [
  {
    id: "trimbak",
    label: "01 // TRIMBAKESHWAR TEMPLE & BRAHMAGIRI",
    alt: "Trimbakeshwar Shiva Temple and Brahmagiri Mountain, Nashik",
    imageUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1Vm4nfE4nPBkA5OnCpI9U_gth-PD3XoMaOIWjIhEWXjhLESuzkPzvank7VIV3PEpGeOx3Mz0r0vCjWjgSda5aGdQtJfSVF3WjhjGyTLvCeoXX9WTxj_1_0-K3SEp_g1KPqGWuwdmv6Sk9ShnJd3A_VRBvYy4M3pQYWiAeKdM2xg8dp3-AXYMSoYUUwMS4Mz3FHaJF_Ra3BwR1B6NY-4l76rkMpkrEyUHhiQLqDZrnW0jTV0u7y0159NqbZz",
  },
  {
    id: "ramkund",
    label: "02 // RAMKUND & GODAVARI GHATS",
    alt: "Ramkund and Godavari River Sacred Ghats, Nashik",
    imageUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1Xlqd1lqzJkL4Tf6nWC1PBkza2j4XqNmoTjVu1MHxZ5qM42hbK75RA4CmqAy2VhAuff1RnLc7Ga1Be-MegWfdmJbxR3Z1s3QiZWic7Gl5twK3GC1vRsNUWfpkx6CLAYt5FZduqPE-WDrPVNrQAbUyP_gCF7qQ7djKYSrbSgNHZKiYbXWjldkYY6o3xbfNmGPtxeNogxZDWrVv3mBnZ5HohhdxVL-nNSv-tDQmGs4Jwmrif-5H45Qz26U9c",
  },
  {
    id: "pandavleni",
    label: "03 // PANDAV LENI RESERVE",
    alt: "Pandav Leni Buddhist Rock-cut Caves, Nashik",
    imageUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1VMx4zRCCffDzB-mn9X20eX9u2u-q3LTzjdq6D2pyjMEFN7hCLlwUloScSgDAcrlIEFstR16csxPOozA4uEezWvylMRqGWPpQtkjEgureulGjcXWe9X_0NW7WhmtfwsV3oqjrfsQh-rPcj4r85slIEegWdo80eG60U6UOZdIIqXTsRPvXK6tIhPE7G-AH_fXsUSMel_8GMYwliZeu_rqsI4NrGqVvI4LqHApZe-tAIpBRVijA30m56sB7vB",
  },
  {
    id: "gangapur",
    label: "04 // GANGAPUR BASIN RESERVOIR",
    alt: "Gangapur Dam Reservoir and Rolling Hills, Nashik",
    imageUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1WSQYvXcBujVXTro4BETLmbBngKPVVR2S_aSefXkQEPvl7XLZPos2KMzsMzfm0cJkoknxf4A2qr6242w8C5IssmTyWV5JjT8xlvdgWKzhsyU3S8hE_7Cx4DEZQJ8SXksMNtrgblUdGmpKjYYGYzPx1VB4p0_9vCbg_K3UL5ghMPYmWyqX2YvR_5qhC_hNq92BRG2ppPtirEhcKkppIOW06BDroc06VpAqIzTui0TIWYNTWpd3CvB232xIVX",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const NashikBackgroundCarousel: FC<NashikBackgroundCarouselProps> = ({
  overlayOpacity = 0.55,
  duration = 42,
  landmarks = DEFAULT_LANDMARKS,
  className = "",
}) => {
  // Preload images so the first frame is never blank
  useEffect(() => {
    landmarks.forEach(({ imageUrl }) => {
      const img = new Image();
      img.src = imageUrl;
    });
  }, [landmarks]);

  // Duplicate slides: track = [1,2,3,4,1,2,3,4]
  // translateY(-50%) moves exactly 4×100vh up → seamless reset to top
  const slides = [...landmarks, ...landmarks];

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none -z-10 bg-[#050b14] ${className}`}
    >
      {/* ── Vertical Filmstrip Track ──────────────────────────────────────── */}
      <div
        className="flex flex-col w-full"
        style={{
          animation: `nashik-vertical-marquee ${duration}s linear infinite`,
          willChange: "transform",
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={`${slide.id}-${i}`}
            aria-hidden={i >= landmarks.length ? "true" : undefined}
            className="relative w-full shrink-0 overflow-hidden"
            style={{ height: "100vh" }}
          >
            <img
              src={slide.imageUrl}
              alt={slide.alt}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover object-center"
              style={{ filter: "brightness(1.1) contrast(1.1) saturate(1.25)" }}
            />

            {/* Landmark label — bottom right, matches Stitch reference */}
            <div className="absolute bottom-8 right-8 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-cyan-400/40 pointer-events-none shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-[10px] text-cyan-200 uppercase tracking-widest">
                {slide.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Atmospheric Overlays ──────────────────────────────────────────── */}

      {/* 1. Primary dark scrim — keep landmarks vivid, text readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, rgba(5,11,20,${overlayOpacity * 0.6}) 0%, rgba(7,17,30,${overlayOpacity * 0.7}) 50%, rgba(5,11,20,${overlayOpacity}) 100%)`,
        }}
      />

      {/* 2. Subtle cyan telemetry grid — UrbanCore brand texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.04,
          backgroundImage:
            "linear-gradient(to right, #8ed5ff 1px, transparent 1px), linear-gradient(to bottom, #8ed5ff 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />

      {/* 3. Scanline glance — thin horizontal shimmer drifting downward */}
      <div
        className="absolute inset-x-0 h-40 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(56,189,248,0.05), transparent)",
          animation: "nashik-scanline-glance 8s ease-in-out infinite",
        }}
      />
    </div>
  );
};

export default NashikBackgroundCarousel;
