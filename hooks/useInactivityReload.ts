import { useEffect, useRef } from 'react';

interface UseInactivityReloadOptions {
  inactivityThreshold?: number; // Tiempo en ms antes de considerar la página inactiva (default: 5 minutos)
  reloadDelay?: number; // Delay antes de recargar cuando se detecta retorno (default: 500ms)
}

/**
 * Hook que detecta cuando el usuario regresa después de un período de inactividad
 * y recarga automáticamente la página para evitar conflictos con otros usuarios.
 * 
 * @param options - Opciones de configuración
 * @param options.inactivityThreshold - Tiempo en ms antes de considerar inactividad (default: 5 minutos)
 * @param options.reloadDelay - Delay antes de recargar (default: 500ms)
 */
export const useInactivityReload = ({
  inactivityThreshold = 5 * 60 * 1000, // 5 minutos por defecto
  reloadDelay = 500
}: UseInactivityReloadOptions = {}) => {
  const lastActiveTime = useRef<number>(Date.now());
  const isReloadingRef = useRef<boolean>(false);

  useEffect(() => {
    // Actualizar el tiempo de última actividad cuando la página está visible
    const updateLastActiveTime = () => {
      if (document.visibilityState === 'visible') {
        lastActiveTime.current = Date.now();
      }
    };

    // Manejar cambios de visibilidad de la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isReloadingRef.current) {
        const currentTime = Date.now();
        const timeSinceLastActive = currentTime - lastActiveTime.current;
        
        console.log('👁️ Pestaña reactivada');
        console.log(`⏱️ Tiempo inactivo: ${Math.round(timeSinceLastActive / 1000)} segundos`);
        
        // Si el tiempo de inactividad supera el umbral, recargar la página
        if (timeSinceLastActive > inactivityThreshold) {
          console.log('🔄 Inactividad detectada. Recargando página para sincronizar...');
          
          // Mostrar mensaje antes de recargar (opcional)
          const mensaje = document.createElement('div');
          mensaje.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px 40px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            text-align: center;
            font-family: system-ui, -apple-system, sans-serif;
          `;
          mensaje.innerHTML = `
            <div style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 10px;">
              🔄 Sincronizando datos...
            </div>
            <div style="font-size: 14px; color: #6b7280;">
              Recargando la aplicación para obtener los últimos cambios
            </div>
            <div style="margin-top: 15px;">
              <div style="width: 40px; height: 40px; margin: 0 auto; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <style>
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          `;
          document.body.appendChild(mensaje);
          
          // Marcar que estamos recargando
          isReloadingRef.current = true;
          
          // Guardar flag en sessionStorage para detectar reload automático
          sessionStorage.setItem('pigmea_auto_reload', 'true');
          
          // Recargar después de un pequeño delay
          setTimeout(() => {
            window.location.reload();
          }, reloadDelay);
        } else {
          console.log('✅ Tiempo de inactividad aceptable. No es necesario recargar.');
          // Actualizar el tiempo de última actividad
          lastActiveTime.current = currentTime;
        }
      } else if (document.visibilityState === 'hidden') {
        console.log('👋 Pestaña inactiva');
        // Actualizar el tiempo cuando la página se oculta
        lastActiveTime.current = Date.now();
      }
    };

    // Verificar si es un reload automático y mostrar mensaje
    if (sessionStorage.getItem('pigmea_auto_reload') === 'true') {
      console.log('✅ Página recargada automáticamente después de inactividad');
      sessionStorage.removeItem('pigmea_auto_reload');
      
      // Opcional: Mostrar notificación temporal
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        animation: slideIn 0.3s ease-out;
      `;
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">✅</span>
          <div>
            <div style="font-weight: 600; margin-bottom: 2px;">Datos actualizados</div>
            <div style="font-size: 13px; opacity: 0.9;">La aplicación se ha sincronizado correctamente</div>
          </div>
        </div>
        <style>
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        </style>
      `;
      document.body.appendChild(notification);
      
      // Remover notificación después de 4 segundos
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        notification.style.cssText += 'animation: slideOut 0.3s ease-in; @keyframes slideOut { to { transform: translateX(100%); opacity: 0; } }';
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 4000);
    }

    // Agregar event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Actualizar tiempo inicial
    updateLastActiveTime();

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [inactivityThreshold, reloadDelay]);

  return {
    lastActiveTime: lastActiveTime.current,
    isReloading: isReloadingRef.current
  };
};
