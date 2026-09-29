/**
 * MunicipalPageShell
 *
 * Shared page wrapper used by every /municipal/* sub-route.
 * Provides:
 *   - Identical background treatment to CitizenDashboard (transparent +
 *     citizen-bg-new.jpg at 0.25 opacity)
 *   - Consistent max-width content area with section header
 *   - Citizen-matching card/panel design tokens
 */

import type { ReactNode } from "react";

interface MunicipalPageShellProps {
  eyebrow: string;
  eyebrowIcon?: ReactNode;
  title: string;
  onBack?: () => void;
  children: ReactNode;
}

const T = {
  cyan: "#22d3ee",
  slate100: "#f1f5f9",
  slate500: "#64748b",
} as const;

export function MunicipalPageShell({
  eyebrow,
  eyebrowIcon,
  title,
  children,
}: MunicipalPageShellProps) {
  return (
    <>
      <style>{`
        .mg-page {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background: transparent;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          font-family: var(--font-sans, 'Manrope', sans-serif);
        }
        .mg-page-bg {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          height: 100%;
          background-image: url("/citizen-bg-new.jpg");
          background-size: cover;
          background-position: center top;
          opacity: 0.25;
          z-index: -1;
          pointer-events: none;
        }
        .mg-content {
          flex: 1;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          padding: 28px 24px 64px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        @media (max-width: 640px) {
          .mg-content { padding: 20px 16px 48px; }
        }
      `}</style>

      <div className="mg-page">
        <div className="mg-page-bg" />
        <div className="mg-content">
          {/* Page section header */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: T.cyan,
              }}
            >
              {eyebrowIcon}
              {eyebrow}
            </span>
            <h1
              style={{
                fontFamily: "var(--font-display,'Sora',sans-serif)",
                fontSize: "clamp(1.4rem, 3vw, 1.85rem)",
                fontWeight: 700,
                color: T.slate100,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {title}
            </h1>
          </div>

          {children}
        </div>
      </div>
    </>
  );
}
