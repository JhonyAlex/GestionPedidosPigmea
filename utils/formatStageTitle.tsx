import React from 'react';

/**
 * Renders a stage title with numbers in bold.
 * 
 * Examples:
 * - "Windmöller 1" → <>"Windmöller "<strong>1</strong></>
 * - "Ec-convert 21" → <>"Ec-convert "<strong>21</strong></>
 * - "Laminación SL2" → <>"Laminación SL"<strong>2</strong></>
 * - "Completado" → "Completado" (no numbers, returns plain string)
 * 
 * @param title The stage title string
 * @returns React node with numbers wrapped in <strong> tags, or plain string if no numbers
 */
export function formatStageTitle(title: string): React.ReactNode {
    // Split by digits, keeping the delimiters
    const parts = title.split(/(\d+)/);
    
    // If no numbers found, return plain title
    if (parts.length === 1) return title;
    
    // Return JSX with bold numbers
    return (
        <>
            {parts.map((part, i) =>
                /\d+/.test(part) ? <strong key={i}>{part}</strong> : part
            )}
        </>
    );
}
