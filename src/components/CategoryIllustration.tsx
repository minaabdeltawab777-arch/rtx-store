import React from 'react';

interface CategoryIllustrationProps {
  categoryId?: string;
  className?: string;
  size?: number;
}

export const CategoryIllustration: React.FC<CategoryIllustrationProps> = ({
  categoryId = 'cat-other',
  className = '',
  size = 48
}) => {
  // Return tailored SVG illustration based on category
  switch (categoryId) {
    case 'cat-laptops':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="10" y="12" width="44" height="30" rx="3" stroke="#76b900" strokeWidth="2.5" fill="#131722" />
          <path d="M14 16H50V38H14V16Z" fill="#1b2130" />
          <path d="M26 24L32 20L38 24V32L32 36L26 32V24Z" stroke="#76b900" strokeWidth="1.5" strokeOpacity="0.5" />
          <path d="M4 44H60C60 46.2 58.2 48 56 48H8C5.8 48 4 46.2 4 44Z" fill="#262d3d" stroke="#3b465e" strokeWidth="2" />
          <line x1="26" y1="44" x2="38" y2="44" stroke="#76b900" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'cat-macbooks':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="10" y="13" width="44" height="29" rx="3.5" stroke="#94a3b8" strokeWidth="2" fill="#0f172a" />
          <path d="M13 16H51V39H13V16Z" fill="#1e293b" />
          <circle cx="32" cy="27" r="4" fill="#cbd5e1" fillOpacity="0.8" />
          <path d="M5 44H59C59 45.8 57.5 47 55.5 47H8.5C6.5 47 5 45.8 5 44Z" fill="#334155" stroke="#475569" strokeWidth="1.5" />
          <rect x="28" y="44" width="8" height="1.5" rx="0.75" fill="#94a3b8" />
        </svg>
      );

    case 'cat-monitors':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="8" y="10" width="48" height="32" rx="3" stroke="#38bdf8" strokeWidth="2" fill="#0c1929" />
          <path d="M12 14H52V38H12V14Z" fill="#112238" />
          <path d="M20 28L28 22L36 30L44 24" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M28 42L26 50H38L36 42" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#1e293b" />
          <line x1="22" y1="50" x2="42" y2="50" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'cat-gpus':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="8" y="18" width="48" height="28" rx="3" stroke="#76b900" strokeWidth="2" fill="#111c13" />
          <circle cx="23" cy="32" r="8" stroke="#76b900" strokeWidth="2" fill="#182c1b" />
          <circle cx="41" cy="32" r="8" stroke="#76b900" strokeWidth="2" fill="#182c1b" />
          <circle cx="23" cy="32" r="2.5" fill="#76b900" />
          <circle cx="41" cy="32" r="2.5" fill="#76b900" />
          <path d="M14 46V51H50V46" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'cat-desktops':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="18" y="10" width="28" height="44" rx="3" stroke="#a855f7" strokeWidth="2.5" fill="#1b122c" />
          <line x1="24" y1="16" x2="40" y2="16" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="27" r="7" stroke="#c084fc" strokeWidth="1.5" />
          <circle cx="32" cy="41" r="7" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="22" y1="50" x2="42" y2="50" stroke="#a855f7" strokeWidth="2" />
        </svg>
      );

    case 'cat-keyboards':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="8" y="20" width="48" height="24" rx="3" stroke="#f59e0b" strokeWidth="2" fill="#241a0d" />
          <rect x="13" y="24" width="5" height="5" rx="1" fill="#fbbf24" />
          <rect x="21" y="24" width="5" height="5" rx="1" fill="#fbbf24" />
          <rect x="29" y="24" width="5" height="5" rx="1" fill="#fbbf24" />
          <rect x="37" y="24" width="5" height="5" rx="1" fill="#fbbf24" />
          <rect x="45" y="24" width="5" height="5" rx="1" fill="#fbbf24" />
          <rect x="20" y="32" width="24" height="6" rx="1" fill="#f59e0b" />
        </svg>
      );

    case 'cat-mice':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path
            d="M32 10C23 10 16 17.5 16 27V37C16 46.5 23 54 32 54C41 54 48 46.5 48 37V27C48 17.5 41 10 32 10Z"
            stroke="#10b981"
            strokeWidth="2.5"
            fill="#0d241c"
          />
          <line x1="32" y1="12" x2="32" y2="28" stroke="#34d399" strokeWidth="2" />
          <rect x="30" y="18" width="4" height="7" rx="2" fill="#6ee7b7" />
        </svg>
      );

    case 'cat-headsets':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path
            d="M16 34C16 25 23 18 32 18C41 18 48 25 48 34"
            stroke="#ec4899"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="12" y="30" width="8" height="16" rx="4" fill="#f472b6" stroke="#db2777" strokeWidth="2" />
          <rect x="44" y="30" width="8" height="16" rx="4" fill="#f472b6" stroke="#db2777" strokeWidth="2" />
          <path d="M48 40C48 48 40 50 34 50H32" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'cat-storage':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="12" y="16" width="40" height="32" rx="3" stroke="#06b6d4" strokeWidth="2" fill="#082029" />
          <circle cx="32" cy="30" r="8" stroke="#22d3ee" strokeWidth="2" />
          <circle cx="32" cy="30" r="2.5" fill="#22d3ee" />
          <line x1="16" y1="42" x2="48" y2="42" stroke="#0891b2" strokeWidth="1.5" />
          <circle cx="44" cy="22" r="2" fill="#06b6d4" />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="14" y="14" width="36" height="36" rx="4" stroke="#76b900" strokeWidth="2" fill="#141a24" />
          <path d="M22 28L32 20L42 28V40L32 46L22 40V28Z" stroke="#76b900" strokeWidth="1.5" strokeOpacity="0.6" />
          <circle cx="32" cy="33" r="3" fill="#76b900" />
        </svg>
      );
  }
};
