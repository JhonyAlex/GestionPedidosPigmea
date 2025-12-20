// =================================================================
// TIPOS PARA EL SISTEMA DE GESTIÓN DE MATERIALES
// =================================================================

export interface Material {
    id: number;
    numero: string;
    descripcion?: string;
    pedidoId?: string;             // 🔗 ID del pedido al que pertenece (opcional)
    pendienteRecibir: boolean;     // ⏳ Pendiente de Recibir / ✅ Material Recibido
    pendienteGestion: boolean;     // 🕑 Pendiente Gestión / ✅ Gestionado
    createdAt?: string;
    updatedAt?: string;
}

export interface MaterialInput {
    numero: string;
    descripcion?: string;
    pendienteRecibir?: boolean;
    pendienteGestion?: boolean;
}

export interface MaterialCreateRequest {
    numero: string;
    descripcion?: string;
    pendienteRecibir?: boolean;
    pendienteGestion?: boolean;
}

export interface MaterialUpdateRequest {
    numero?: string;
    descripcion?: string;
    pendienteRecibir?: boolean;
    pendienteGestion?: boolean;
}
