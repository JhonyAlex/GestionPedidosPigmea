import React, { useState } from 'react';
import { CommentFormData } from '../../types/comments';

interface CommentInputProps {
  onSubmit: (data: CommentFormData) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({ 
  onSubmit, 
  isSubmitting = false,
  placeholder = "Escribe un comentario...",
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting) {
      return;
    }

    try {
      await onSubmit({ message: message.trim() });
      setMessage('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Error al enviar comentario:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!message.trim()) {
      setIsExpanded(false);
    }
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
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled || isSubmitting}
                rows={isExpanded ? 3 : 1}
                              className={`
                w-full px-4 py-3 rounded-xl resize-none 
                border-2 transition-all duration-200
                ${isExpanded 
                  ? 'border-blue-500 dark:border-blue-400' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
                focus:outline-none focus:border-blue-500 dark:focus:border-blue-400
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                placeholder-gray-500 dark:placeholder-gray-400
                ${disabled || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                ${isExpanded ? 'min-h-[80px]' : 'min-h-[40px]'}
              `}
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E0 transparent'
                }}
              />
              
              {/* Contador de caracteres */}
              {isExpanded && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
                  {message.length}/500
                </div>
              )}
            </div>
            
            {/* Botones de acción */}
            {isExpanded && (
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 
                                 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                    Enter
                  </kbd> para enviar, <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 
                                              bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                    Shift+Enter
                  </kbd> para nueva línea
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMessage('');
                      setIsExpanded(false);
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={!message.trim() || isSubmitting || message.length > 500}
                    className={`
                      px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200
                      flex items-center space-x-2
                      ${!message.trim() || isSubmitting || message.length > 500
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                      }
                    `}
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