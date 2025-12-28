
import React from 'react';

interface SkillBadgeProps {
  label: string;
  variant?: 'knows' | 'wants';
}

const SkillBadge: React.FC<SkillBadgeProps> = ({ label, variant = 'knows' }) => {
  const styles = variant === 'knows' 
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
    : 'bg-amber-50 text-amber-700 border-amber-100/50';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold border transition-all hover:scale-105 cursor-default shadow-sm ${styles}`}>
      {variant === 'knows' ? '✓ ' : '⚡ '}
      {label}
    </span>
  );
};

export default SkillBadge;
