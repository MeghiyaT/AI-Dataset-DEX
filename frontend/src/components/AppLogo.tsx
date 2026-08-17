import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Modern geometric luxury tech logo for DataVault AI
 * Interlocking multifaceted zero-knowledge vault prism in Yale Blue (#0D3B66) and Lemon Chiffon (#FAF0CA).
 */
export function AppLogo({ size = 36, className, style }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        {/* Yale Blue Glass Gradients */}
        <linearGradient id="dv-blue-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1860A3" />
          <stop offset="50%" stopColor="#0D3B66" />
          <stop offset="100%" stopColor="#061E34" />
        </linearGradient>

        {/* Lemon Chiffon Highlights */}
        <linearGradient id="dv-chiffon-grad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDF5" />
          <stop offset="60%" stopColor="#FAF0CA" />
          <stop offset="100%" stopColor="#F5E4A8" />
        </linearGradient>

        <linearGradient id="dv-facet-grad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FAF0CA" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0D3B66" stopOpacity="0.35" />
        </linearGradient>

        <filter id="dv-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0D3B66" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Outer Hexagonal Shield Matrix (Glass Vault Structure) */}
      <path
        d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
        fill="url(#dv-blue-grad)"
        stroke="url(#dv-chiffon-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Top Isometric Facet */}
      <path
        d="M24 4L42 14L24 24L6 14L24 4Z"
        fill="#FAF0CA"
        fillOpacity="0.18"
      />

      {/* Right Isometric Facet */}
      <path
        d="M24 24L42 14V34L24 44V24Z"
        fill="#061E34"
        fillOpacity="0.6"
      />

      {/* Left Isometric Facet */}
      <path
        d="M24 24L6 14V34L24 44V24Z"
        fill="#1860A3"
        fillOpacity="0.45"
      />

      {/* Interlocking ZK Core Vault Prism */}
      <path
        d="M24 13L33 18.5V29.5L24 35L15 29.5V18.5L24 13Z"
        fill="url(#dv-blue-grad)"
        stroke="#FAF0CA"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Inner Central Data Key Matrix (Zero-Knowledge Node) */}
      <circle cx="24" cy="24" r="3.2" fill="#FAF0CA" />
      <circle cx="24" cy="24" r="1.5" fill="#0D3B66" />

      {/* Subtle Connection Rays */}
      <line x1="24" y1="4" x2="24" y2="13" stroke="#FAF0CA" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="42" y1="14" x2="33" y2="18.5" stroke="#FAF0CA" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="6" y1="14" x2="15" y2="18.5" stroke="#FAF0CA" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="24" y1="44" x2="24" y2="35" stroke="#FAF0CA" strokeWidth="1.4" strokeOpacity="0.75" />
    </svg>
  );
}
