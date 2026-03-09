import React from 'react';

interface UndoRedoProviderProps {
    children: React.ReactNode;
}

/**
 * Provider legacy (solo envoltorio).
 * El proyecto ya no expone acciones de deshacer/rehacer desde la UI.
 * La funcionalidad de registro de acciones está en hooks/useActionRecorder.ts
 */
export const UndoRedoProvider: React.FC<UndoRedoProviderProps> = ({
    children,
}) => {
    return <>{children}</>;
};
