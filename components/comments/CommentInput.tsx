import React, { useState, useRef, useEffect } from 'react';
import { CommentFormData } from '../../types/comments';
import { MentionedUser } from '../../utils/mentions';
import MentionAutocomplete from '../MentionAutocomplete';

interface CommentInputProps {
  onSubmit: (data: CommentFormData) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onIsTypingChange?: (isTyping: boolean) => void;
  /** Lista de usuarios disponibles para mencionar */
  availableUsers?: MentionedUser[];
}

const CommentInput: React.FC<CommentInputProps> = ({ 
  onSubmit, 
  isSubmitting = false,
  placeholder = "Escribe un comentario... (@usuario para mencionar)",
  disabled = false,
  onIsTypingChange,
  availableUsers = []
}) => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [autocompleteCoordinates, setAutocompleteCoordinates] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    try {
      await onSubmit({ message: message.trim() });
      setMessage('');
      setIsExpanded(false);
      setShowMentionAutocomplete(false);
    } catch (error) {
      console.error('Error al enviar comentario:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Si el autocomplete está abierto, no procesar Enter (lo manejará el autocomplete)
    if (showMentionAutocomplete && (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Escape')) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    setMessage(newValue);
    setCursorPosition(newCursorPosition);
    
    // Detectar si se escribió '@' para mostrar autocomplete
    const textBeforeCursor = newValue.substring(0, newCursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    // Verificar si hay un '@' reciente y no hay espacio después
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setShowMentionAutocomplete(true);
        calculateAutocompletePosition();
      } else {
        setShowMentionAutocomplete(false);
      }
    } else {
      setShowMentionAutocomplete(false);
    }
  };

  const handleSelectUser = (user: MentionedUser, mentionStart: number, mentionEnd: number) => {
    // Reemplazar @búsqueda con @username
    const before = message.substring(0, mentionStart);
    const after = message.substring(mentionEnd);
    const newMessage = `${before}@${user.username} ${after}`;
    
    setMessage(newMessage);
    setShowMentionAutocomplete(false);
    
    // Enfocar el textarea y mover el cursor después de la mención
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newCursorPos = mentionStart + user.username.length + 2; // +2 por @ y espacio
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const calculateAutocompletePosition = () => {
    if (!textareaRef.current) return;
    
    // Posicionar el dropdown justo debajo del textarea
    const rect = textareaRef.current.getBoundingClientRect();
    setAutocompleteCoordinates({
      top: rect.height + 5, // 5px debajo del textarea
      left: 10
    });
  };

  // Actualizar posición del cursor cuando el usuario navega con el teclado
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionChange = () => {
      setCursorPosition(textarea.selectionStart);
    };

    textarea.addEventListener('select', handleSelectionChange);
    textarea.addEventListener('click', handleSelectionChange);
    
    return () => {
      textarea.removeEventListener('select', handleSelectionChange);
      textarea.removeEventListener('click', handleSelectionChange);
    };
  }, []);

  const handleFocus = () => {
    setIsExpanded(true);
    onIsTypingChange?.(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // No cerrar si el blur es porque se está interactuando con el autocomplete
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest('[data-mention-autocomplete]')) {
      return;
    }
    
    if (!message.trim()) setIsExpanded(false);
    onIsTypingChange?.(false);
    
    // Cerrar autocomplete con delay para permitir clicks en el dropdown
    setTimeout(() => {
      setShowMentionAutocomplete(false);
    }, 200);
  };

  return (
    <div className="border-t-2 border-gray-200 dark:border-gray-600 
                    bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 
                            rounded-full flex items-center justify-center text-white text-sm font-semibold 
                            border border-indigo-400 dark:border-purple-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled || isSubmitting}
                rows={isExpanded ? 3 : 1}
                className={`w-full px-4 py-3 rounded-xl resize-none border-2 transition-all duration-200
                  ${isExpanded ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
                  focus:outline-none focus:border-blue-500 dark:focus:border-blue-400
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  placeholder-gray-500 dark:placeholder-gray-400
                  ${disabled || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isExpanded ? 'min-h-[80px]' : 'min-h-[40px]'}`}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 transparent' }}
              />
              {isExpanded && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
                  {message.length}/500
                </div>
              )}
              
              {/* Autocomplete de menciones */}
              {showMentionAutocomplete && availableUsers.length > 0 && (
                <div data-mention-autocomplete>
                  <MentionAutocomplete
                    text={message}
                    cursorPosition={cursorPosition}
                    onSelectUser={handleSelectUser}
                    onClose={() => setShowMentionAutocomplete(false)}
                    users={availableUsers}
                    coordinates={autocompleteCoordinates}
                  />
                </div>
              )}
            </div>
            
            {isExpanded && (
              <div className="flex items-center justify-between mt-2">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  <kbd className="px-1 py-0.5 text-[9px] font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                    @
                  </kbd> mencionar usuario • <kbd className="px-1 py-0.5 text-[9px] font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                    Enter
                  </kbd> enviar • <kbd className="px-1 py-0.5 text-[9px] font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                    Shift+Enter
                  </kbd> nueva línea
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => { setMessage(''); setIsExpanded(false); }}
                    className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={!message.trim() || isSubmitting || message.length > 500}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2
                      ${!message.trim() || isSubmitting || message.length > 500
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Enviar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommentInput;