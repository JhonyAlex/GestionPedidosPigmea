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
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

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
        // Calcular posición del tooltip cuando se hace visible
        if (isVisible && buttonRef.current && tooltipRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let top = 0;
            let left = 0;

            // Calcular posición según preferencia
            switch (position) {
                case 'top':
                    top = buttonRect.top - tooltipRect.height - 8;
                    left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'bottom':
                    top = buttonRect.bottom + 8;
                    left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    top = buttonRect.top + (buttonRect.height / 2) - (tooltipRect.height / 2);
                    left = buttonRect.left - tooltipRect.width - 8;
                    break;
                case 'right':
                    top = buttonRect.top + (buttonRect.height / 2) - (tooltipRect.height / 2);
                    left = buttonRect.right + 8;
                    break;
            }

            // Ajustar si se sale del viewport
            if (left < 10) left = 10;
            if (left + tooltipRect.width > viewportWidth - 10) {
                left = viewportWidth - tooltipRect.width - 10;
            }
            if (top < 10) top = 10;
            if (top + tooltipRect.height > viewportHeight - 10) {
                top = viewportHeight - tooltipRect.height - 10;
            }

            setTooltipPosition({ top, left });
        }
    }, [isVisible, position]);

    useEffect(() => {
        // Cerrar tooltip al hacer click fuera (solo en móvil)
        if (!isMobile || !isVisible) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
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

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none flex-shrink-0"
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

            {/* Tooltip con position fixed para evitar cortes */}
            {isVisible && (
                <div 
                    ref={tooltipRef}
                    className="fixed z-[9999] animate-fade-in"
                    style={{ 
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                        maxWidth: '320px',
                        width: 'max-content'
                    }}
                >
                    <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-2xl p-3 border border-gray-700 dark:border-gray-600">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="leading-relaxed">{content}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InfoTooltip;
