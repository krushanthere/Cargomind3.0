import React from "react";

export interface CargoMindLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  variant?: "glyph" | "full";
}

/**
 * CargoMind Official Geometric Brand Mark
 * Minimal, technical, and memorable precision logistics mark.
 * Designed on a 24x24 pixel grid.
 */
export function CargoMindLogo({
  size = 24,
  className = "",
  variant = "glyph",
  ...props
}: CargoMindLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Precision Geometric Route & Node Glyph */}
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.75"
        fill="currentColor"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.75"
        fill="currentColor"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.75"
        fill="currentColor"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.75"
        fill="currentColor"
        fillOpacity="0.4"
      />
      {/* Interconnecting dynamic bridge line */}
      <path
        d="M6.5 10V14M10 6.5H14M17.5 10V14M10 17.5H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default CargoMindLogo;
