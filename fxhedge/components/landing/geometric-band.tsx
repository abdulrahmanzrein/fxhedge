"use client";

/**
 * GeometricBand — an 8-point-star (khatam) girih lattice behind the hero.
 * Islamic geometry as texture: two overlapping squares per tile, drawn once
 * on load (one-shot CSS animation), then still. Whisper opacity.
 */
export function GeometricBand({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden
      width="100%"
      height="280"
      viewBox="0 0 560 280"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="khatam" width="56" height="56" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1">
            <rect x="16" y="16" width="24" height="24" className="khatam-draw" />
            <rect
              x="16"
              y="16"
              width="24"
              height="24"
              transform="rotate(45 28 28)"
              className="khatam-draw"
            />
          </g>
        </pattern>
      </defs>
      <rect width="560" height="280" fill="url(#khatam)" />
    </svg>
  );
}
