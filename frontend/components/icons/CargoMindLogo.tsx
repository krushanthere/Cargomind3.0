import React from "react";

export interface CargoMindLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * CargoMind Official Brand Mark
 * Faceted low-poly map pin marker with integrated perspective road.
 */
export function CargoMindLogo({
  size = 32,
  className = "",
  ...props
}: CargoMindLogoProps) {
  const clipId = React.useId().replace(/:/g, "_");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Clip path for the upper pin ring */}
        <clipPath id={`pin-clip-${clipId}`}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 100 12 C 51.4 12 12 51.4 12 100 C 12 125.6 23 148.6 40.5 164.8 L 78 138 L 100 80 L 122 138 L 159.5 164.8 C 177 148.6 188 125.6 188 100 C 188 51.4 148.6 12 100 12 Z M 100 52 C 126.5 52 148 73.5 148 100 C 148 126.5 126.5 148 100 148 C 73.5 148 52 126.5 52 100 C 52 73.5 73.5 52 100 52 Z"
          />
        </clipPath>
      </defs>

      {/* ----------------------------------------------------------------- */}
      {/* 1. Upper Pin Faceted Geometric Triangles (Clipped to Ring)         */}
      {/* ----------------------------------------------------------------- */}
      <g clipPath={`url(#pin-clip-${clipId})`}>
        {/* Top-Center & Top-Right Emerald / Lime */}
        <polygon points="100,12 142,32 100,60" fill="#4ade80" />
        <polygon points="100,12 58,32 100,60" fill="#22c55e" />
        <polygon points="142,32 182,58 140,80" fill="#86efac" />
        <polygon points="142,32 140,80 100,60" fill="#34d399" />
        
        {/* Top-Left & Mid-Left Teal / Ocean Cyan */}
        <polygon points="58,32 18,58 60,80" fill="#10b981" />
        <polygon points="58,32 60,80 100,60" fill="#059669" />
        <polygon points="18,58 12,100 52,100" fill="#14b8a6" />
        <polygon points="18,58 52,100 60,80" fill="#0d9488" />
        <polygon points="12,100 24,142 56,126" fill="#06b6d4" />
        <polygon points="12,100 56,126 52,100" fill="#0284c7" />

        {/* Bottom-Left Royal Navy / Deep Blue */}
        <polygon points="24,142 40,165 68,146" fill="#0369a1" />
        <polygon points="24,142 68,146 56,126" fill="#0284c7" />
        <polygon points="40,165 78,138 68,146" fill="#1e3a8a" />
        <polygon points="68,146 78,138 100,80" fill="#1e40af" />
        <polygon points="56,126 68,146 100,80" fill="#0369a1" />

        {/* Right & Bottom-Right Mint / Forest Green / Sea Teal */}
        <polygon points="182,58 188,100 148,100" fill="#6ee7b7" />
        <polygon points="182,58 148,100 140,80" fill="#34d399" />
        <polygon points="188,100 176,142 144,126" fill="#10b981" />
        <polygon points="188,100 144,126 148,100" fill="#059669" />
        <polygon points="176,142 160,165 132,146" fill="#047857" />
        <polygon points="176,142 132,146 144,126" fill="#065f46" />
        <polygon points="160,165 122,138 132,146" fill="#064e3b" />
        <polygon points="132,146 122,138 100,80" fill="#0f766e" />
        <polygon points="144,126 132,146 100,80" fill="#0d9488" />
      </g>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Lower Pin Body & Perspective Road                               */}
      {/* ----------------------------------------------------------------- */}
      {/* Dark Forest Green / Slate Road Body */}
      <path
        d="M 96 100 L 104 100 L 138 146 C 146 158 146 172 136 186 C 126 198 112 210 100 212 C 88 210 74 198 64 186 C 54 172 54 158 62 146 Z"
        fill="#072218"
      />

      {/* Road Perspective White Dashed Center Lane */}
      <path
        d="M 97.5 178 L 102.5 178 L 103.2 202 L 96.8 202 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 98 150 L 102 150 L 102.4 168 L 97.6 168 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 98.4 128 L 101.6 128 L 101.8 142 L 98.2 142 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 98.7 112 L 101.3 112 L 101.4 122 L 98.6 122 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 99.1 101 L 100.9 101 L 101 107 L 99 107 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export default CargoMindLogo;

