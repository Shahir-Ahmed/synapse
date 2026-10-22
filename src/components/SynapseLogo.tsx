import React from 'react';

interface SynapseLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  monochrome?: boolean;
}

export const SynapseLogo: React.FC<SynapseLogoProps> = ({
  className = '',
  size = 32,
  showWordmark = true,
  wordmarkClassName = 'text-lg font-bold tracking-tight text-[#14243A]',
  monochrome = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Precision Geometric SVG Symbol */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Rounded square container with subtle radial depth */}
        <rect
          width="40"
          height="40"
          rx="10"
          fill={monochrome ? 'currentColor' : '#14243A'}
        />
        {/* Subtle grid accent */}
        <path
          d="M8 20H32M20 8V32"
          stroke={monochrome ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        {/* Synaptic interlinked node paths */}
        <path
          d="M12 28L20 20L28 28"
          stroke={monochrome ? 'rgba(255,255,255,0.7)' : '#147D78'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12L20 20L28 12"
          stroke={monochrome ? 'rgba(255,255,255,0.7)' : '#147D78'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 20H30"
          stroke={monochrome ? '#FFFFFF' : '#38B2AC'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Central Luminous Synapse Diamond Core */}
        <circle cx="20" cy="20" r="3.5" fill={monochrome ? '#FFFFFF' : '#FFFFFF'} />
        <circle cx="20" cy="20" r="2" fill={monochrome ? '#14243A' : '#147D78'} />
        {/* Terminal Synaptic Nodes */}
        <circle cx="12" cy="12" r="2" fill={monochrome ? '#FFFFFF' : '#90CDF4'} />
        <circle cx="28" cy="12" r="2" fill={monochrome ? '#FFFFFF' : '#90CDF4'} />
        <circle cx="12" cy="28" r="2" fill={monochrome ? '#FFFFFF' : '#90CDF4'} />
        <circle cx="28" cy="28" r="2" fill={monochrome ? '#FFFFFF' : '#90CDF4'} />
        <circle cx="10" cy="20" r="1.5" fill={monochrome ? '#FFFFFF' : '#FFFFFF'} />
        <circle cx="30" cy="20" r="1.5" fill={monochrome ? '#FFFFFF' : '#FFFFFF'} />
      </svg>

      {showWordmark && (
        <span className={wordmarkClassName}>
          ClearFeedback
        </span>
      )}
    </div>
  );
};
