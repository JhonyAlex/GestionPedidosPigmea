// Tipos para gestión de vendedores

export interface Vendedor {
    id: string;
    nombre: string;
    email?: string;
    telefono?: string;
    activo: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface VendedorCreateRequest {
    nombre: string;
    email?: string;
    telefono?: string;
    activo?: boolean;
}

export interface VendedorUpdateRequest {
    nombre?: string;
    email?: string;
    telefono?: string;
    activo?: boolean;
}
