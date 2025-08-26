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
