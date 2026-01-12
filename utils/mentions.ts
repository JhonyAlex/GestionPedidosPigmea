/**
 * Utilidades para procesar menciones (@usuario) en comentarios
 */

export interface MentionedUser {
  id: string;
  username: string;
}

export interface ParsedMention {
  username: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Expresión regular para detectar menciones en el formato @usuario
 * Permite letras, números, guiones bajos, puntos y espacios
 * Se captura hasta encontrar un espacio doble, salto de línea o final del texto
 */
const MENTION_REGEX = /@([\w.-]+(?:\s+[\w.-]+)*)/g;

/**
 * Extrae todas las menciones (@usuario) de un texto
 * @param text - Texto del comentario
 * @returns Array de menciones encontradas con sus posiciones
 */
export function extractMentions(text: string): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  let match: RegExpExecArray | null;

  // Reset regex index
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.push({
      username: match[1], // El username sin el @
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return mentions;
}

/**
 * Valida y filtra menciones para asegurar que los usuarios existen
 * Limita el número de menciones según MAX_MENTIONS
 * @param text - Texto del comentario
 * @param availableUsers - Lista de usuarios disponibles
 * @param currentUserId - ID del usuario actual (para permitir auto-menciones)
 * @param maxMentions - Máximo número de menciones permitidas (default: 5)
 * @returns Array de usuarios mencionados válidos
 */
export function parseMentions(
  text: string,
  availableUsers: MentionedUser[],
  currentUserId: string,
  maxMentions: number = 5
): MentionedUser[] {
  const extractedMentions = extractMentions(text);
  
  if (extractedMentions.length === 0) {
    return [];
  }

  // Crear un mapa de usernames para búsqueda rápida (case-insensitive)
  const userMap = new Map<string, MentionedUser>();
  availableUsers.forEach(user => {
    userMap.set(user.username.toLowerCase(), user);
  });

  // Validar menciones y eliminar duplicados
  const validMentions = new Map<string, MentionedUser>();

  for (const mention of extractedMentions) {
    const user = userMap.get(mention.username.toLowerCase());
    
    if (user && !validMentions.has(user.id)) {
      validMentions.set(user.id, user);
      
      // Limitar número de menciones
      if (validMentions.size >= maxMentions) {
        break;
      }
    }
  }

  return Array.from(validMentions.values());
}

/**
 * Renderiza el texto del comentario reemplazando menciones con componentes HTML
 * @param text - Texto del comentario
 * @param mentionedUsers - Usuarios mencionados válidos
 * @returns Array de segmentos de texto y menciones
 */
export function renderMentions(
  text: string,
  mentionedUsers: MentionedUser[]
): Array<{ type: 'text' | 'mention'; content: string; user?: MentionedUser }> {
  const extractedMentions = extractMentions(text);
  
  if (extractedMentions.length === 0) {
    return [{ type: 'text', content: text }];
  }

  // Crear un mapa de usernames para búsqueda rápida
  const userMap = new Map<string, MentionedUser>();
  mentionedUsers.forEach(user => {
    userMap.set(user.username.toLowerCase(), user);
  });

  const segments: Array<{ type: 'text' | 'mention'; content: string; user?: MentionedUser }> = [];
  let lastIndex = 0;

  for (const mention of extractedMentions) {
    // Agregar texto antes de la mención
    if (mention.startIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, mention.startIndex)
      });
    }

    // Verificar si la mención es válida
    const user = userMap.get(mention.username.toLowerCase());
    
    if (user) {
      // Mención válida
      segments.push({
        type: 'mention',
        content: `@${mention.username}`,
        user
      });
    } else {
      // Mención inválida, tratarla como texto normal
      segments.push({
        type: 'text',
        content: text.substring(mention.startIndex, mention.endIndex)
      });
    }

    lastIndex = mention.endIndex;
  }

  // Agregar texto restante después de la última mención
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return segments;
}

/**
 * Obtiene los IDs únicos de usuarios mencionados
 * @param mentionedUsers - Array de usuarios mencionados
 * @returns Array de IDs únicos
 */
export function getMentionedUserIds(mentionedUsers: MentionedUser[]): string[] {
  return [...new Set(mentionedUsers.map(user => user.id))];
}

/**
 * Verifica si un texto contiene menciones
 * @param text - Texto a verificar
 * @returns true si el texto contiene al menos una mención
 */
export function hasMentions(text: string): boolean {
  MENTION_REGEX.lastIndex = 0;
  return MENTION_REGEX.test(text);
}

/**
 * Cuenta el número de menciones en un texto
 * @param text - Texto a analizar
 * @returns Número de menciones encontradas
 */
export function countMentions(text: string): number {
  return extractMentions(text).length;
}
