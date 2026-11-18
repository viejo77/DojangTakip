import React from 'react';
import { BeltLevel } from '../types/club';
import { getBeltMeta } from '../utils/beltUtils';

interface BeltBadgeProps {
  belt: BeltLevel;
  size?: 'sm' | 'md';
  showText?: boolean;
}

export const BeltBadge: React.FC<BeltBadgeProps> = ({
  belt,
  size = 'md',
  showText = true,
}) => {
  const meta = getBeltMeta(belt);
  const widthClass = size === 'sm' ? 'w-6 h-2.5' : 'w-8 h-3';

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`relative inline-block ${widthClass} rounded-[2px] border border-slate-300 shadow-xs shrink-0 overflow-hidden`}
        style={{ background: meta.barGradient }}
      >
        {meta.danCount && meta.stripeHex && (
          <span className="absolute inset-y-0 right-1 flex items-center gap-0.5">
            {Array.from({ length: meta.danCount }).map((_, idx) => (
              <span
                key={idx}
                className="w-[2px] h-full block"
                style={{ backgroundColor: meta.stripeHex }}
              />
            ))}
          </span>
        )}
      </span>
      {showText && (
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium text-slate-800`}>
          {belt}
        </span>
      )}
    </span>
  );
};
