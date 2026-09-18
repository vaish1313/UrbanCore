import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Mic,
  LocateFixed,
  Clock,
  TrendingUp,
  ChevronRight,
  X,
} from "lucide-react";
import {
  SEARCH_SUGGESTIONS,
  POPULAR_SEARCHES,
  RECENT_SEARCHES_KEY,
} from "@/data/citizenMockData";

const ease = [0.16, 1, 0.3, 1] as const;

type Suggestion = { label: string; type: string; lat: number; lng: number };

interface HeroSearchProps {
  onSearch: (suggestion: Suggestion) => void;
  onDropPin: () => void;
}

export function HeroSearch({ onSearch, onDropPin }: HeroSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Suggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 4));
    } catch {}
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = query.length > 0
    ? SEARCH_SUGGESTIONS.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase()) ||
        s.type.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  const showDropdown = focused && (filtered.length > 0 || query.length === 0);
  const showRecent = focused && query.length === 0 && recentSearches.length > 0;
  const showPopular = focused && query.length === 0;

  const handleSelect = useCallback((s: Suggestion) => {
    setQuery(s.label);
    setFocused(false);

    // Save to recent
    try {
      const next = [s, ...recentSearches.filter((r) => r.label !== s.label)].slice(0, 4);
      setRecentSearches(next);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {}

    onSearch(s);
  }, [recentSearches, onSearch]);

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  return (
    <section className="cs-hero">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease }}
        className="cs-hero-inner"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="cs-hero-badge"
        >
          <span className="cs-badge-dot" />
          AI Urban Intelligence · Nashik 2026
        </motion.div>

        {/* Heading */}
        <h1 className="cs-hero-heading">
          <span className="text-white">Citizen </span>
          <span className="cs-heading-gradient">Intelligence</span>
        </h1>

        {/* Subtitle */}
        <p className="cs-hero-subtitle">
          Explore your locality using satellite intelligence, monitor urban
          development, and generate AI-powered location insights.
        </p>

        {/* Search bar */}
        <div ref={wrapperRef} className="cs-search-wrapper">
          <motion.div
            className={`cs-search-bar ${focused ? "cs-search-bar--focused" : ""}`}
            animate={{ boxShadow: focused ? "0 0 0 2px rgba(34,211,238,0.25), 0 8px 32px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.3)" }}
            transition={{ duration: 0.2 }}
          >
            <Search className="cs-search-icon-left" aria-hidden />
            <input
              id="hero-search-input"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered[0]) handleSelect(filtered[0]);
                if (e.key === "Escape") setFocused(false);
              }}
              placeholder="Search Address, PIN Code, Village, Latitude…"
              className="cs-search-input"
              autoComplete="off"
              aria-label="Search location"
            />
            {query && (
              <button type="button" className="cs-search-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
            {/* Voice placeholder */}
            <button type="button" className="cs-search-action-btn" aria-label="Voice search">
              <Mic className="h-4 w-4" />
            </button>
            {/* Divider */}
            <div className="cs-search-sep" />
            {/* Location */}
            <motion.button
              type="button"
              id="use-my-location-btn"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="cs-location-btn"
              onClick={() => handleSelect({ label: "Current Location", type: "GPS", lat: 20.0059, lng: 73.7912 })}
              aria-label="Use current location"
            >
              <LocateFixed className="h-4 w-4" />
              <span className="hidden sm:inline">Use My Location</span>
            </motion.button>
            {/* Search button */}
            <motion.button
              type="button"
              id="hero-search-btn"
              whileHover={{ scale: 1.03, opacity: 0.92 }}
              whileTap={{ scale: 0.97 }}
              className="cs-search-submit"
              onClick={() => filtered[0] && handleSelect(filtered[0])}
            >
              Search
            </motion.button>
          </motion.div>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease }}
                className="cs-dropdown"
              >
                {/* Filtered results */}
                {filtered.length > 0 && (
                  <div className="cs-dropdown-section">
                    <p className="cs-dropdown-label">Results</p>
                    {filtered.map((s) => (
                      <DropdownItem key={s.label} item={s} onSelect={handleSelect} icon={<Search className="h-4 w-4 text-cyan-400" />} />
                    ))}
                  </div>
                )}

                {/* Recent searches */}
                {showRecent && (
                  <div className="cs-dropdown-section">
                    <div className="cs-dropdown-label-row">
                      <p className="cs-dropdown-label">Recent</p>
                      <button type="button" className="cs-dropdown-clear" onClick={clearRecent}>Clear</button>
                    </div>
                    {recentSearches.map((s) => (
                      <DropdownItem key={s.label} item={s} onSelect={handleSelect} icon={<Clock className="h-4 w-4 text-slate-500" />} />
                    ))}
                  </div>
                )}

                {/* Popular searches */}
                {showPopular && (
                  <div className="cs-dropdown-section">
                    <p className="cs-dropdown-label">Popular in Nashik</p>
                    {POPULAR_SEARCHES.map((s) => (
                      <DropdownItem key={s.label} item={s} onSelect={handleSelect} icon={<TrendingUp className="h-4 w-4 text-cyan-500/70" />} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* OR Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="cs-or-divider"
        >
          <span className="cs-or-line" />
          <span className="cs-or-text">OR</span>
          <span className="cs-or-line" />
        </motion.div>

        {/* Drop Pin button */}
        <motion.button
          id="drop-pin-btn"
          type="button"
          onClick={onDropPin}
          whileHover={{ scale: 1.03, boxShadow: "0 0 32px rgba(34,211,238,0.2)" }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease }}
          className="cs-drop-pin-btn"
        >
          <ChevronRight className="h-4 w-4 rotate-90" aria-hidden />
          Drop Pin on Map
        </motion.button>
      </motion.div>

      {/* Embedded styles */}
      <style>{`
        .cs-hero {
          width: 100%;
          padding: 52px 24px 44px;
          display: flex;
          justify-content: center;
        }
        .cs-hero-inner {
          width: 100%;
          max-width: 760px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0;
        }
        .cs-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(34,211,238,0.2);
          background: rgba(34,211,238,0.06);
          color: #67e8f9;
          border-radius: 999px;
          padding: 5px 14px;
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .cs-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow: 0 0 8px #22d3ee;
          animation: cs-pulse 2s ease-in-out infinite;
        }
        @keyframes cs-pulse { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
        .cs-hero-heading {
          font-family: var(--font-display, "Sora", sans-serif);
          font-size: clamp(2.6rem, 7vw, 4.5rem);
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.08;
          margin: 0 0 18px;
        }
        .cs-heading-gradient {
          background: linear-gradient(90deg,#22d3ee 0%,#38bdf8 45%,#818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cs-hero-subtitle {
          font-size: 1rem;
          color: #94a3b8;
          line-height: 1.7;
          max-width: 540px;
          margin: 0 0 32px;
        }
        /* Search bar */
        .cs-search-wrapper {
          width: 100%;
          position: relative;
          margin-bottom: 20px;
          z-index: 50;
        }
        .cs-search-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 5px 5px 5px 16px;
          backdrop-filter: blur(28px);
          transition: border-color 0.2s;
        }
        .cs-search-bar--focused {
          border-color: rgba(34,211,238,0.4);
        }
        .cs-search-icon-left {
          width: 18px; height: 18px;
          color: #64748b;
          flex-shrink: 0;
        }
        .cs-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.9375rem;
          color: #fff;
          padding: 9px 6px;
          font-family: var(--font-sans, "Manrope", sans-serif);
          min-width: 0;
        }
        .cs-search-input::placeholder { color: #475569; }
        .cs-search-clear {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.07);
          color: #64748b;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.15s, background 0.15s;
        }
        .cs-search-clear:hover { background: rgba(255,255,255,0.12); color: #e2e8f0; }
        .cs-search-action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #475569;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .cs-search-action-btn:hover { color: #94a3b8; }
        .cs-search-sep {
          width: 1px; height: 20px;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .cs-location-btn {
          display: flex; align-items: center; gap: 6px;
          border: none;
          background: transparent;
          color: #22d3ee;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .cs-location-btn:hover { color: #67e8f9; }
        .cs-search-submit {
          display: flex; align-items: center;
          background: linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%);
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 10px 24px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }
        /* Dropdown */
        .cs-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 0; right: 0;
          background: rgba(8,12,28,0.97);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(28px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          z-index: 60;
          max-height: 380px;
          overflow-y: auto;
        }
        .cs-dropdown-section { padding: 12px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .cs-dropdown-section:last-child { border-bottom: none; }
        .cs-dropdown-label { font-size: 0.65rem; font-family: var(--font-mono,monospace); text-transform: uppercase; letter-spacing: 0.15em; color: #475569; padding: 0 8px 6px; }
        .cs-dropdown-label-row { display: flex; align-items: center; justify-content: space-between; padding: 0 8px 6px; }
        .cs-dropdown-clear { font-size: 0.7rem; color: #475569; background: none; border: none; cursor: pointer; transition: color 0.15s; }
        .cs-dropdown-clear:hover { color: #94a3b8; }
        /* OR Divider */
        .cs-or-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .cs-or-line { width: 52px; height: 1px; background: rgba(255,255,255,0.1); }
        .cs-or-text { font-family: var(--font-mono,monospace); font-size: 0.625rem; letter-spacing: 0.2em; text-transform: uppercase; color: #475569; }
        /* Drop pin button */
        .cs-drop-pin-btn {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(34,211,238,0.35);
          background: rgba(34,211,238,0.07);
          color: #67e8f9;
          border-radius: 999px;
          padding: 11px 28px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .cs-drop-pin-btn:hover { background: rgba(34,211,238,0.13); }
        @media (max-width: 640px) {
          .cs-hero { padding: 36px 16px 28px; }
          .cs-search-bar { flex-wrap: wrap; border-radius: 20px; padding: 10px 12px; }
          .cs-search-input { padding: 6px 4px; font-size: 0.875rem; }
          .cs-search-submit { width: 100%; justify-content: center; border-radius: 12px; margin-top: 6px; }
          .cs-search-sep { display: none; }
        }
      `}</style>
    </section>
  );
}

function DropdownItem({
  item,
  onSelect,
  icon,
}: {
  item: { label: string; type: string; lat: number; lng: number };
  onSelect: (s: any) => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="cs-dropdown-item"
      onClick={() => onSelect(item)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "9px 8px",
        background: "none",
        border: "none",
        cursor: "pointer",
        borderRadius: "12px",
        transition: "background 0.12s",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "0.875rem", color: "#f1f5f9", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
        <span style={{ display: "block", fontSize: "0.7rem", color: "#475569", marginTop: 1 }}>{item.type}</span>
      </span>
    </button>
  );
}
