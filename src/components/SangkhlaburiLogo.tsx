import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const SangkhlaburiLogo: React.FC<LogoProps> = ({ 
  className = "w-12 h-12", 
  size = 48,
  showText = false 
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm select-none"
      >
        {/* Outer Circular Rim */}
        <circle cx="100" cy="100" r="97" fill="#0d5c3a" stroke="#064228" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="92" fill="#ffffff" />
        <circle cx="100" cy="100" r="69" fill="#0d5c3a" stroke="#064228" strokeWidth="2" />
        <circle cx="100" cy="100" r="64" fill="#0a482d" />

        {/* Text Along Path (SVG Text) */}
        {/* Top Thai Text Path */}
        <path
          id="top-text-arc"
          d="M 23,100 A 77,77 0 0,1 177,100"
          fill="none"
        />
        {/* Bottom English Text Path */}
        <path
          id="bottom-text-arc"
          d="M 177,100 A 77,77 0 0,1 23,100"
          fill="none"
        />

        <text fill="#0d5c3a" fontSize="15.5" fontWeight="bold" fontFamily="Sarabun, sans-serif" letterSpacing="0.8">
          <textPath href="#top-text-arc" startOffset="50%" textAnchor="middle">
            โรงพยาบาลสังขละบุรี
          </textPath>
        </text>

        <text fill="#0d5c3a" fontSize="11.5" fontWeight="bold" fontFamily="Prompt, sans-serif" letterSpacing="1.8">
          <textPath href="#bottom-text-arc" startOffset="50%" textAnchor="middle">
            SANGKHLABURI HOSPITAL
          </textPath>
        </text>

        {/* Left and Right Ornament Flanks */}
        <g fill="#0d5c3a">
          <circle cx="16" cy="100" r="3.2" />
          <polygon points="19,95 24,100 19,105 14,100" />
          <circle cx="184" cy="100" r="3.2" />
          <polygon points="176,95 181,100 176,105 171,100" />
        </g>

        {/* Center Emblem: Thai MOPH Caduceus (Torch, Serpents, Wings) in Crisp White/Gold Style */}
        <g transform="translate(100, 100) scale(0.62) translate(-100, -100)">
          {/* Torch Staff / Shaft */}
          <path
            d="M96 55 L104 55 L102 165 L98 165 Z"
            fill="#ffffff"
            stroke="#0a482d"
            strokeWidth="1.2"
          />
          {/* Torch Fluted Handle Base */}
          <path
            d="M95 165 L105 165 L100 176 Z"
            fill="#ffffff"
          />
          <circle cx="100" cy="178" r="3.5" fill="#ffffff" />
          
          {/* Torch Flame (Thai Kranok / Flame motif) */}
          <path
            d="M100 30 C103 40 108 46 109 52 C105 52 101 48 100 56 C99 48 95 52 91 52 C92 46 97 40 100 30 Z"
            fill="#ffffff"
          />
          <path
            d="M100 38 C102 43 105 47 104 51 C101 50 100 47 100 51 C99 47 98 50 96 51 C95 47 98 43 100 38 Z"
            fill="#d1fae5"
          />
          {/* Torch Cup */}
          <path
            d="M92 54 C94 59 106 59 108 54 L105 62 L95 62 Z"
            fill="#ffffff"
          />

          {/* Left Wing */}
          <path
            d="M95 72 C80 62 60 62 48 76 C56 79 66 79 73 84 C62 86 52 92 46 99 C55 98 68 96 76 101 C68 105 58 111 55 119 C68 114 82 106 93 92 Z"
            fill="#ffffff"
            opacity="0.95"
          />
          {/* Right Wing */}
          <path
            d="M105 72 C120 62 140 62 152 76 C144 79 134 79 127 84 C138 86 148 92 154 99 C145 98 132 96 124 101 C132 105 142 111 145 119 C132 114 118 106 107 92 Z"
            fill="#ffffff"
            opacity="0.95"
          />

          {/* Twin Serpents (Nagas / Snakes coiled around staff) */}
          {/* Upper Left Serpent Head */}
          <path
            d="M86 78 C80 75 73 78 70 82 C72 87 79 88 85 86 C88 85 91 82 86 78 Z"
            fill="#ffffff"
          />
          {/* Upper Right Serpent Head */}
          <path
            d="M114 78 C120 75 127 78 130 82 C128 87 121 88 115 86 C112 85 109 82 114 78 Z"
            fill="#ffffff"
          />
          {/* Coiling Body - Loop 1 */}
          <path
            d="M80 88 C70 98 72 112 85 118 C92 121 98 120 100 115 C96 112 90 109 86 103 C83 98 84 92 80 88 Z"
            fill="#ffffff"
          />
          <path
            d="M120 88 C130 98 128 112 115 118 C108 121 102 120 100 115 C104 112 110 109 114 103 C117 98 116 92 120 88 Z"
            fill="#ffffff"
          />
          {/* Coiling Body - Loop 2 */}
          <path
            d="M100 116 C108 122 118 128 115 138 C112 147 101 151 92 148 C97 143 103 140 104 134 C105 129 102 123 100 116 Z"
            fill="#ffffff"
          />
          <path
            d="M100 116 C92 122 82 128 85 138 C88 147 99 151 108 148 C103 143 97 140 96 134 C95 129 98 123 100 116 Z"
            fill="#ffffff"
          />
          {/* Entwined Tails at Base */}
          <path
            d="M93 149 C97 156 100 162 100 168 C100 162 103 156 107 149 C102 153 98 153 93 149 Z"
            fill="#ffffff"
          />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
            โรงพยาบาลสังขละบุรี
          </span>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium tracking-wide">
            Sangkhlaburi Hospital • ระบบทะเบียนคุมลูกหนี้
          </span>
        </div>
      )}
    </div>
  );
};
