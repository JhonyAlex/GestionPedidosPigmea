# Casos de Prueba - Módulo de Clientes

Este documento describe los casos de prueba manuales para asegurar la robustez, validación y seguridad del nuevo módulo de gestión de clientes.

## Fase 1: Validación de Formularios (Crear/Editar Cliente)

### Validación de Nombre
- [ ] **Nombre vacío:** Intentar guardar el formulario con el campo "Nombre" vacío.
  - **Resultado esperado:** Debería mostrarse un mensaje de error "El nombre es requerido" y el formulario no se debe enviar.
- [ ] **Nombre con solo espacios:** Ingresar varios espacios en el campo "Nombre" y guardar.
  - **Resultado esperado:** El sistema debería normalizar el input (con `trim()`) y tratarlo como vacío, mostrando el error "El nombre es requerido".
- [ ] **Nombre muy largo:** Ingresar un nombre con más de 255 caracteres.
  - **Resultado esperado:** Debería mostrarse un error de validación de longitud máxima mientras se escribe o al intentar guardar.
- [ ] **Nombre duplicado:** Crear un cliente con un nombre, y luego intentar crear un segundo cliente con el mismo nombre exacto.
  - **Resultado esperado:** Al intentar guardar el segundo cliente, el formulario debería mostrar un error en el campo "Nombre" indicando "Ya existe un cliente con este nombre".

### Validación de Email
- [ ] **Email vacío:** Dejar el campo "Email" vacío.
  - **Resultado esperado:** El formulario se debe guardar correctamente, ya que el email es opcional.
- [ ] **Email inválido:** Ingresar una cadena que no sea un email válido (ej: "test", "test@test", "test.com").
  - **Resultado esperado:** Debería mostrarse un mensaje de error "Email inválido" en tiempo real.
- [ ] **Email válido:** Ingresar un email con formato correcto.
  - **Resultado esperado:** No se muestra ningún error y se guarda correctamente.

### Validación de Teléfono
- [ ] **Teléfono con caracteres inválidos:** Ingresar letras o símbolos no permitidos.
  - **Resultado esperado:** Debería mostrarse un error de formato "Formato de teléfono inválido".
- [ ] **Formatos válidos:** Probar diferentes formatos de teléfono válidos (ej: `+34 123 456 789`, `(123) 456-7890`, `123456789`).
  - **Resultado esperado:** Todos los formatos válidos deben ser aceptados sin error.

## Fase 2: Casos Extremos y Sanitización

- [ ] **Caracteres especiales:** Usar nombres y campos de texto con acentos (`áéíóú`), `ñ`, y otros caracteres latinos.
  - **Resultado esperado:** Todos los caracteres deben guardarse y mostrarse correctamente.
- [ ] **Emojis:** Intentar guardar emojis en campos de texto como "Nombre" o "Comentarios".
  - **Resultado esperado:** El sistema debería manejarlos sin romperse. Dependiendo de la implementación, podrían ser filtrados o guardados correctamente.
- [ ] **Campos muy largos:** Pegar un texto muy largo en campos como "Comentarios" o "Dirección".
  - **Resultado esperado:** El sistema no debe romperse. El texto puede ser truncado en la base de datos (si hay límite) o manejado correctamente por la UI.
- [ ] **Inyección de Scripts (XSS):** Intentar guardar código HTML o JavaScript simple en campos de texto (ej: `<script>alert('test')</script>`, `<b>test</b>`).
  - **Resultado esperado:** Al mostrar los datos, el código no debe ejecutarse. El HTML debe mostrarse como texto plano o ser sanitizado (ej: se muestra `<b>test</b>` literalmente, no en negrita).

## Fase 3: Lógica de Negocio y Seguridad

- [ ] **Eliminar cliente con pedidos:** Intentar eliminar un cliente que tenga al menos un pedido asociado.
  - **Resultado esperado:** La operación debe fallar y mostrar un mensaje de error claro, como "No se puede eliminar el cliente porque tiene pedidos asociados".
- [ ] **Acciones sin permisos:** Iniciar sesión con un rol que no tenga permisos (ej: `Operador` sin permiso de eliminar) e intentar realizar la acción prohibida.
  - **Resultado esperado:** El botón para la acción no debería ser visible. Si se intenta acceder a la acción por otros medios, la API debería devolver un error de permisos (403 Forbidden).
- [ ] **Transiciones de estado:** Cambiar el estado de un cliente de "activo" a "inactivo" y viceversa.
  - **Resultado esperado:** El cambio debe reflejarse correctamente en la lista y en la tarjeta del cliente.

## Fase 4: Concurrencia (Requiere dos sesiones de navegador)

- [ ] **Creación simultánea:** Dos usuarios intentan crear un cliente con el mismo nombre al mismo tiempo.
  - **Resultado esperado:** Solo uno debería tener éxito. El segundo debería recibir el error de "nombre duplicado".
- [ ] **Edición simultánea:** Un usuario abre el modal para editar un cliente. Otro usuario edita y guarda cambios en el mismo cliente. El primer usuario intenta guardar sus propios cambios.
  - **Resultado esperado:** El sistema debería manejar esto de forma predecible. Una estrategia común es que "el último guardado gana". Idealmente, el sistema podría detectar el conflicto y advertir al primer usuario.
- [ ] **Editar y eliminar:** Un usuario edita un cliente mientras otro usuario lo elimina.
  - **Resultado esperado:** El usuario que está editando debería recibir un error al intentar guardar, indicando que el cliente ya no existe.
