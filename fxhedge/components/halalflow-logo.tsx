interface Props {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * Rising-stock-arrow brand mark for HalalFlow.
 * A zigzag going up-right that ends in a proper arrowhead.
 */
export function HalalFlowLogo({ size = 26, className, withGlow = true }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #16A34A, #4ADE80)",
        boxShadow: withGlow ? "0 0 18px rgba(34,197,94,0.45)" : "none",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        fill="none"
        stroke="#04120A"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Zigzag line: bottom-left → up → dip → up → arrow tip (top-right) */}
        <polyline points="4,17 9,12 12,15 19,7" />
        {/* Arrowhead at the tip (19,7) */}
        <polyline points="14,7 19,7 19,12" />
      </svg>
    </span>
  );
}
