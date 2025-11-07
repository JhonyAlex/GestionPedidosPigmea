import React from 'react';

interface LockIndicatorProps {
  isLocked: boolean;
  lockedBy?: string | null;
  isLockedByMe: boolean;
  size?: 'small' | 'medium';
}

/**
 * Componente visual para indicar el estado de bloqueo de un pedido
 */
const LockIndicator: React.FC<LockIndicatorProps> = ({ 
  isLocked, 
  lockedBy, 
  isLockedByMe,
  size = 'small'
}) => {
  if (!isLocked) return null;

  const sizeClasses = size === 'small' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div 
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${
        isLockedByMe 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      }`}
      title={isLockedByMe ? 'Estás editando este pedido' : `Bloqueado por ${lockedBy}`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2} 
        stroke="currentColor" 
        className={iconSize}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" 
        />
      </svg>
      <span>{isLockedByMe ? '✏️' : lockedBy}</span>
    </div>
  );
};

export default LockIndicator;
