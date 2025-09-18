import React, { forwardRef, useImperativeHandle } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteFormSchema, ClienteFormSchema } from '../../schemas/clienteSchema';
import { Cliente } from '../../types/cliente';

interface ClienteFormProps {
  initialData?: Cliente | null;
  onSubmit: (data: ClienteFormSchema) => void;
  isSaving: boolean;
}

const FormInput = ({ name, label, register, error, ...props }: any) => (
  <div>
    <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <input
      id={name}
      {...register(name)}
      {...props}
      className={`w-full bg-gray-100 dark:bg-gray-700 border rounded-lg p-2.5 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

const FormTextarea = ({ name, label, register, error, ...props }: any) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <textarea
            id={name}
            {...register(name)}
            {...props}
            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
        />
        {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
);

const FormSelect = ({ name, label, register, error, children, ...props }: any) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <select
            id={name}
            {...register(name)}
            {...props}
            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5"
        >
            {children}
        </select>
        {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
);


export interface ClienteFormHandle {
  setError: (name: keyof ClienteFormSchema, error: { type: string; message: string }) => void;
}

const ClienteForm = forwardRef<ClienteFormHandle, ClienteFormProps>(({ initialData, onSubmit, isSaving }, ref) => {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<ClienteFormSchema>({
    resolver: zodResolver(clienteFormSchema),
    mode: 'onChange', // Validate on change for real-time feedback
    defaultValues: {
      nombre: initialData?.nombre || '',
      contactoPrincipal: initialData?.contactoPrincipal || '',
      telefono: initialData?.telefono || '',
      email: initialData?.email || '',
      direccion: initialData?.direccion || '',
      comentarios: initialData?.comentarios || '',
      estado: initialData?.estado || 'activo',
    },
  });

  useImperativeHandle(ref, () => ({
    setError,
  }));

  return (
    <form id="cliente-form" onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSaving} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna Izquierda */}
                <div className="space-y-4">
                    <FormInput name="nombre" label="Nombre del Cliente" register={register} error={errors.nombre} required />
                    <FormInput name="contactoPrincipal" label="Contacto Principal" register={register} error={errors.contactoPrincipal} />
                    <FormInput name="telefono" label="Teléfono" type="tel" register={register} error={errors.telefono} />
                    <FormInput name="email" label="Email" type="email" register={register} error={errors.email} />
                </div>
                {/* Columna Derecha */}
                <div className="space-y-4">
                    <FormTextarea name="direccion" label="Dirección" register={register} error={errors.direccion} rows={4} />
                    <FormTextarea name="comentarios" label="Comentarios" register={register} error={errors.comentarios} rows={4} />
                    <FormSelect name="estado" label="Estado" register={register} error={errors.estado}>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                    </FormSelect>
                </div>
            </div>
            {/* Hidden submit button to allow form submission on Enter key press */}
            <button type="submit" className="hidden"></button>
        </fieldset>
    </form>
  );
});

export default ClienteForm;
