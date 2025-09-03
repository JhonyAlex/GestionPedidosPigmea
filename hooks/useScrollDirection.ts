import { useState, useEffect } from 'react';

export const useScrollDirection = () => {
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const updateScrollDirection = () => {
            const scrollY = window.pageYOffset;
            const direction = scrollY > lastScrollY ? 'down' : 'up';
            
            // Solo actualizar si el scroll es significativo (más de 10px)
            if (Math.abs(scrollY - lastScrollY) > 10) {
                setScrollDirection(direction);
                setLastScrollY(scrollY);
            }
        };

        const handleScroll = () => {
            requestAnimationFrame(updateScrollDirection);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    return scrollDirection;
};
