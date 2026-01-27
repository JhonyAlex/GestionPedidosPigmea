import React, { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    size?: 'sm' | 'md' | 'lg';
}

/**
 * InfoTooltip - Componente reutilizable para mostrar información contextual
 * 
 * Este componente muestra un ícono de información (ℹ️) que al hacer hover
 * o click muestra un tooltip con la explicación de cómo se obtiene el dato.
 */
const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
    content, 
    position = 'top',
    size = 'sm'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Detectar si es móvil para cambiar comportamiento
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Cerrar tooltip al hacer click fuera (solo en móvil)
        if (!isMobile || !isVisible) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isVisible, isMobile]);

    const sizeClasses = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800 dark:border-t-gray-700',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800 dark:border-b-gray-700',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800 dark:border-l-gray-700',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800 dark:border-r-gray-700'
    };

    return (
        <div className="relative inline-flex" ref={tooltipRef}>
            <button
                type="button"
                className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none"
                onMouseEnter={() => !isMobile && setIsVisible(true)}
                onMouseLeave={() => !isMobile && setIsVisible(false)}
                onClick={() => isMobile && setIsVisible(!isVisible)}
                aria-label="Más información"
            >
                <svg 
                    className={`${sizeClasses[size]} fill-current`}
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                        fillRule="evenodd" 
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                        clipRule="evenodd" 
                    />
                </svg>
            </button>

            {/* Tooltip */}
            {isVisible && (
                <div 
                    className={`absolute z-50 ${positionClasses[position]} animate-fade-in`}
                    style={{ width: 'max-content', maxWidth: '300px' }}
                >
                    <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg p-3 border border-gray-700 dark:border-gray-600">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="leading-relaxed">{content}</p>
                        </div>
                    </div>
                    {/* Arrow */}
                    <div 
                        className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
                    />
                </div>
            )}
        </div>
    );
};

export default InfoTooltip;
