import React, { useState, useEffect, useRef } from 'react';
import { MentionedUser } from '../utils/mentions';

interface MentionAutocompleteProps {
  /** Texto actual del input */
  text: string;
  /** Posición del cursor en el texto */
  cursorPosition: number;
  /** Callback cuando se selecciona un usuario */
  onSelectUser: (user: MentionedUser, mentionStart: number, mentionEnd: number) => void;
  /** Callback cuando se cierra el autocomplete */
  onClose: () => void;
  /** Lista de usuarios disponibles para mencionar */
  users: MentionedUser[];
  /** Coordenadas para posicionar el dropdown (relativo al textarea) */
  coordinates?: { top: number; left: number };
}

const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  text,
  cursorPosition,
  onSelectUser,
  onClose,
  users,
  coordinates
}) => {
  const [filteredUsers, setFilteredUsers] = useState<MentionedUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detectar mención activa y filtrar usuarios
  useEffect(() => {
    // Buscar hacia atrás desde la posición del cursor para encontrar '@'
    let start = -1;
    for (let i = cursorPosition - 1; i >= 0; i--) {
      if (text[i] === '@') {
        start = i;
        break;
      }
      // Si encontramos un espacio o salto de línea antes del @, no hay mención activa
      if (text[i] === ' ' || text[i] === '\n') {
        break;
      }
    }

    if (start === -1) {
      onClose();
      return;
    }

    // Extraer el término de búsqueda (texto después del @)
    const term = text.substring(start + 1, cursorPosition).toLowerCase();
    setMentionStart(start);
    setSearchTerm(term);

    // Filtrar usuarios que coincidan con el término de búsqueda
    const filtered = users.filter(user =>
      user.username.toLowerCase().startsWith(term)
    );

    setFilteredUsers(filtered);
    setSelectedIndex(0);

    // Si no hay coincidencias, cerrar el autocomplete
    if (filtered.length === 0) {
      onClose();
    }
  }, [text, cursorPosition, users, onClose]);

  // Manejar teclas de navegación
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredUsers.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          break;
        case 'Enter':
        case 'Tab':
          if (filteredUsers[selectedIndex]) {
            e.preventDefault();
            handleSelectUser(filteredUsers[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, selectedIndex, onClose]);

  // Scroll automático al item seleccionado
  useEffect(() => {
    if (dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectUser = (user: MentionedUser) => {
    onSelectUser(user, mentionStart, cursorPosition);
  };

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto"
      style={{
        top: coordinates?.top ?? 0,
        left: coordinates?.left ?? 0,
        minWidth: '200px',
        maxWidth: '300px'
      }}
    >
      {filteredUsers.map((user, index) => (
        <button
          key={user.id}
          type="button"
          onClick={() => handleSelectUser(user)}
          className={`
            w-full px-4 py-2 text-left flex items-center gap-3 transition-colors
            ${
              index === selectedIndex
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
            }
            ${index === 0 ? 'rounded-t-lg' : ''}
            ${index === filteredUsers.length - 1 ? 'rounded-b-lg' : ''}
          `}
        >
          {/* Avatar con inicial */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm
            ${index === selectedIndex ? 'bg-blue-600' : 'bg-gray-500'}
          `}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          
          {/* Username */}
          <div className="flex-1">
            <div className="font-medium">
              {searchTerm && user.username.toLowerCase().startsWith(searchTerm.toLowerCase()) ? (
                <>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {user.username.substring(0, searchTerm.length)}
                  </span>
                  {user.username.substring(searchTerm.length)}
                </>
              ) : (
                user.username
              )}
            </div>
          </div>

          {/* Indicador de selección */}
          {index === selectedIndex && (
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
      
      {/* Footer con hint de navegación */}
      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
        ↑↓ Navegar • Enter/Tab Seleccionar • Esc Cerrar
      </div>
    </div>
  );
};

export default MentionAutocomplete;
