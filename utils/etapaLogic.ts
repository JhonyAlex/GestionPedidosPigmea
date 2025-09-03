import { Etapa } from '../types';
import { KANBAN_FUNNELS } from '../constants';

export const calcularSiguienteEtapa = (etapaActual: Etapa, secuenciaTrabajo: Etapa[] | undefined): Etapa | null => {
  const isPrinting = KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual);
  const isPostPrinting = KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual);

  if (isPrinting && secuenciaTrabajo && secuenciaTrabajo.length > 0) {
    return secuenciaTrabajo[0];
  } else if (isPostPrinting && secuenciaTrabajo) {
    const currentIndex = secuenciaTrabajo.indexOf(etapaActual);
    if (currentIndex > -1 && currentIndex < secuenciaTrabajo.length - 1) {
      return secuenciaTrabajo[currentIndex + 1];
    } else if (currentIndex === secuenciaTrabajo.length - 1) {
      return Etapa.COMPLETADO;
    }
  }
  return null;
};

/**
 * Determina si un pedido está fuera de la secuencia definida
 */
export const estaFueraDeSecuencia = (etapaActual: Etapa, secuenciaTrabajo: Etapa[] | undefined): boolean => {
  // Si no hay secuencia definida, no puede estar fuera de secuencia
  if (!secuenciaTrabajo || secuenciaTrabajo.length === 0) {
    return false;
  }
  
  // Si está en impresión, siempre puede seguir la secuencia
  if (KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual)) {
    return false;
  }
  
  // Si está en post-impresión pero no está en la secuencia, está fuera de secuencia
  if (KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual)) {
    return !secuenciaTrabajo.includes(etapaActual);
  }
  
  return false;
};

/**
 * Determina si un pedido puede avanzar en su secuencia (incluso si está fuera de secuencia)
 */
export const puedeAvanzarSecuencia = (etapaActual: Etapa, secuenciaTrabajo: Etapa[] | undefined, antivaho: boolean = false, antivahoRealizado: boolean = false): boolean => {
  // Si está en preparación y tiene material, puede enviar a impresión
  if (etapaActual === Etapa.PREPARACION) {
    return false; // Se maneja desde PreparacionView
  }
  
  // Si está en impresión y tiene secuencia, puede continuar
  if (KANBAN_FUNNELS.IMPRESION.stages.includes(etapaActual) && secuenciaTrabajo && secuenciaTrabajo.length > 0) {
    return true;
  }
  
  // Si está en post-impresión, siempre puede intentar continuar
  if (KANBAN_FUNNELS.POST_IMPRESION.stages.includes(etapaActual)) {
    // Para pedidos con antivaho no realizado, siempre puede continuar
    if (antivaho && !antivahoRealizado) {
      return true;
    }
    
    // Si tiene secuencia definida, puede continuar (incluso si está fuera de secuencia)
    if (secuenciaTrabajo && secuenciaTrabajo.length > 0) {
      return true;
    }
  }
  
  return false;
};
