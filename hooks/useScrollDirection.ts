import { useState, useEffect } from 'react';

export const useScrollDirection = () => {
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 5; // Umbral muy pequeño para ocultar inmediatamente
      
      if (scrollY <= threshold) {
        setIsAtTop(true);
      } else {
        setIsAtTop(false);
      }
    };

    // Verificar posición inicial
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return isAtTop;
};
