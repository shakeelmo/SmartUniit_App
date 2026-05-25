import React from 'react';

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
      <span className={sizeClasses[size]} style={{ color }} aria-label="Saudi Riyal">
        ﷼
      </span>
      {showLabel && <span>SAR</span>}
    </span>
  );
};

export default SaudiRiyalSymbol;
