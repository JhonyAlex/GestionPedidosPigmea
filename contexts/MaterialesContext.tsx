import React, { createContext, useContext, ReactNode } from 'react';
import { useMaterialesManager } from '../hooks/useMaterialesManager';
import { Material, MaterialCreateRequest, MaterialUpdateRequest } from '../types/material';

interface MaterialesContextType {
    materiales: Material[];
    loading: boolean;
    error: string | null;
    fetchMateriales: () => Promise<void>;
    addMaterial: (materialData: MaterialCreateRequest) => Promise<Material>;
    updateMaterial: (id: number, materialData: MaterialUpdateRequest) => Promise<Material>;
    deleteMaterial: (id: number) => Promise<void>;
    getMaterialesByPedidoId: (pedidoId: string) => Promise<Material[]>;
    assignMaterialToPedido: (pedidoId: string, materialId: number) => Promise<void>;
    unassignMaterialFromPedido: (pedidoId: string, materialId: number) => Promise<void>;
}

const MaterialesContext = createContext<MaterialesContextType | undefined>(undefined);

export const MaterialesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const materialesManager = useMaterialesManager();

    return (
        <MaterialesContext.Provider value={materialesManager}>
            {children}
        </MaterialesContext.Provider>
    );
};

export const useMateriales = () => {
    const context = useContext(MaterialesContext);
    if (context === undefined) {
        throw new Error('useMateriales debe ser usado dentro de MaterialesProvider');
    }
    return context;
};
