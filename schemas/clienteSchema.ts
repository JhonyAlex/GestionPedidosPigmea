import { z } from 'zod';

export const clienteFormSchema = z.object({
  nombre: z.string()
    .trim()
    .min(1, { message: 'El nombre es requerido.' })
    .max(255, { message: 'El nombre no puede exceder los 255 caracteres.' }),

  contactoPrincipal: z.string().trim().max(255, { message: 'El contacto no puede exceder los 255 caracteres.' }).optional().or(z.literal('')),

  telefono: z.string()
    .trim()
    .regex(/^[\d\-\+\(\)\s\.]{7,20}$/, { message: 'Formato de teléfono inválido.' })
    .optional()
    .or(z.literal('')),

  email: z.string()
    .trim()
    .email({ message: 'El formato del email no es válido.' })
    .optional()
    .or(z.literal('')),

  direccion: z.string().trim().optional(),

  comentarios: z.string().trim().optional(),

  estado: z.enum(['activo', 'inactivo']),
});

export type ClienteFormSchema = z.infer<typeof clienteFormSchema>;
