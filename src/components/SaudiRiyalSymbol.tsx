import React from 'react';
import { SAUDI_RIYAL_SYMBOL } from '../utils/format';

interface SaudiRiyalSymbolProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  showLabel?: boolean;
}

export const SaudiRiyalSymbol: React.FC<SaudiRiyalSymbolProps> = ({
  className = '',
  size = 'md',
  color = 'currentColor',
  showLabel = false
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} style={{ color }}>
      <span className={`icon-saudi_riyal ${sizeClasses[size]}`} style={{ color }}>
        {SAUDI_RIYAL_SYMBOL}
      </span>
      {showLabel && <span>SAR</span>}
    </span>
  );
};

export default SaudiRiyalSymbol;
