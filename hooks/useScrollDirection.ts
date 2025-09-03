import { useState, useEffect, useRef } from 'react';

export const useScrollDirection = () => {
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const updateScrollDirection = () => {
            const scrollY = window.pageYOffset;
            
            // Solo actualizar si el scroll es significativo (más de 20px para reducir sensibilidad)
            if (Math.abs(scrollY - lastScrollY.current) > 20) {
                const direction = scrollY > lastScrollY.current ? 'down' : 'up';
                
                // Cancelar timeout anterior si existe
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                
                // Debounce para evitar cambios muy rápidos
                timeoutRef.current = setTimeout(() => {
                    setScrollDirection(direction);
                    lastScrollY.current = scrollY;
                }, 100); // 100ms de debounce
            }
            
            ticking.current = false;
        };

        const handleScroll = () => {
            if (!ticking.current) {
                requestAnimationFrame(updateScrollDirection);
                ticking.current = true;
            }
        };

        // Inicializar con la posición actual
        lastScrollY.current = window.pageYOffset;

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []); // Sin dependencias para evitar re-creación del listener

    return scrollDirection;
};
