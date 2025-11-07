import { useEffect, useRef } from 'react';

interface UseInactivityReloadOptions {
  inactivityThreshold?: number; // Tiempo en ms antes de considerar la página inactiva (default: 30 minutos)
  reloadDelay?: number; // Delay antes de recargar cuando se detecta retorno (default: 500ms)
  onLogout?: () => void; // Callback para cerrar sesión
}

/**
 * Hook que detecta cuando el usuario regresa después de un período de inactividad
 * y cierra sesión automáticamente para evitar conflictos con otros usuarios.
 * 
 * ⚠️ IMPORTANTE: Después de 30 minutos de inactividad, se cierra la sesión automáticamente
 * para garantizar que los datos estén sincronizados y liberar bloqueos de pedidos.
 * 
 * @param options - Opciones de configuración
 * @param options.inactivityThreshold - Tiempo en ms antes de considerar inactividad (default: 30 minutos)
 * @param options.reloadDelay - Delay antes de recargar (default: 500ms)
 * @param options.onLogout - Callback para cerrar sesión
 */
export const useInactivityReload = ({
  inactivityThreshold = 30 * 60 * 1000, // 30 minutos por defecto (sincronizado con bloqueo de pedidos)
  reloadDelay = 500,
  onLogout
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
        console.log(`⏱️ Tiempo inactivo: ${Math.round(timeSinceLastActive / 1000)} segundos (${Math.round(timeSinceLastActive / 60000)} minutos)`);
        
        // Si el tiempo de inactividad supera el umbral, cerrar sesión y recargar
        if (timeSinceLastActive > inactivityThreshold) {
          console.log('� Inactividad prolongada detectada (>30 min). Cerrando sesión por seguridad...');
          
          // Mostrar mensaje antes de cerrar sesión
          const mensaje = document.createElement('div');
          mensaje.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 40px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            text-align: center;
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 400px;
          `;
          mensaje.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">⏱️</div>
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 10px;">
              Sesión Expirada
            </div>
            <div style="font-size: 14px; opacity: 0.95; margin-bottom: 20px; line-height: 1.5;">
              Has estado inactivo por más de 30 minutos.<br/>
              Por seguridad, cerramos tu sesión automáticamente.
            </div>
            <div style="font-size: 13px; opacity: 0.8; margin-bottom: 15px;">
              🔓 Todos los bloqueos de pedidos han sido liberados<br/>
              🔄 La aplicación se recargará en unos segundos
            </div>
            <div style="margin-top: 20px;">
              <div style="width: 40px; height: 40px; margin: 0 auto; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
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
          
          // Cerrar sesión si se proporcionó el callback
          if (onLogout) {
            onLogout();
          }
          
          // Limpiar localStorage y sessionStorage
          localStorage.removeItem('pigmea_user');
          sessionStorage.setItem('pigmea_session_expired', 'true');
          
          // Recargar después de un delay
          setTimeout(() => {
            window.location.href = '/'; // Redirigir a la raíz para forzar login
          }, 3000); // 3 segundos para que el usuario lea el mensaje
        } else {
          console.log('✅ Tiempo de inactividad aceptable. No es necesario cerrar sesión.');
          // Actualizar el tiempo de última actividad
          lastActiveTime.current = currentTime;
        }
      } else if (document.visibilityState === 'hidden') {
        console.log('👋 Pestaña inactiva');
        // Actualizar el tiempo cuando la página se oculta
        lastActiveTime.current = Date.now();
      }
    };

    // Verificar si es un reload por sesión expirada y mostrar mensaje
    if (sessionStorage.getItem('pigmea_session_expired') === 'true') {
      console.log('🔒 Sesión expirada por inactividad - Mostrando pantalla de login');
      sessionStorage.removeItem('pigmea_session_expired');
      
      // Mostrar notificación temporal informativa
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          <span style="font-size: 24px;">🔒</span>
          <div>
            <div style="font-weight: 600; margin-bottom: 2px;">Sesión cerrada</div>
            <div style="font-size: 13px; opacity: 0.9;">Por inactividad prolongada (>30 min)</div>
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
      
      // Remover notificación después de 5 segundos
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        notification.style.cssText += 'animation: slideOut 0.3s ease-in; @keyframes slideOut { to { transform: translateX(100%); opacity: 0; } }';
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 5000);
    }

    // Agregar event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Actualizar tiempo inicial
    updateLastActiveTime();

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [inactivityThreshold, reloadDelay, onLogout]);

  return {
    lastActiveTime: lastActiveTime.current,
    isReloading: isReloadingRef.current
  };
};
