# Plan de Implementación: Módulo de Importación de Pedidos PDF

Este plan detalla el desarrollo del nuevo módulo de importación de PDF, diseñado para integrarse con el sistema existente de "Gestión de Pedidos Pigmea".

## 1. Arquitectura y Stack Tecnológico
Se mantendrá la arquitectura actual, extendiendo las capacidades del Backend y Frontend.
*   **Backend**: Node.js + Express. Se añadirán librerías para procesamiento de archivos (`multer`) y parsing de PDF (`pdf-parse`).
*   **Frontend**: React + TypeScript. Nuevo modal de importación con vista previa.
*   **Base de Datos**: PostgreSQL. Nuevas tablas para configuraciones de mapeo y registro de archivos.
*   **Almacenamiento**: Sistema de archivos local organizado por fecha (`storage/pedidos-pdf/YYYY/MM/`).

## 2. Cambios en Base de Datos
Se creará una nueva migración SQL para añadir las siguientes estructuras:
*   **Tabla `pdf_import_configs`**: Almacenará las reglas de extracción para diferentes formatos de PDF (ej. "Formato Cliente A", "Formato Cliente B").
    *   Campos: `id`, `name`, `extraction_rules` (JSON), `created_at`.
*   **Tabla `pdf_files`** (Opcional/Auditoría): Registro de archivos procesados.
    *   Campos: `id`, `filename`, `filepath`, `upload_date`, `status`, `imported_orders_count`.

## 3. Desarrollo Backend (API & Servicios)
### 3.1. Nuevas Dependencias
*   Instalación de `multer` (gestión de subida de archivos) y `pdf-parse` (extracción de texto).

### 3.2. Servicios (`backend/services/pdfService.js`)
*   **Upload & Storage**: Lógica para guardar el PDF físicamente y generar rutas únicas.
*   **Parser Engine**:
    *   Extracción de texto crudo del PDF.
    *   **Motor de Reglas**: Aplicación de expresiones regulares (Regex) o delimitadores ("Empieza después de...", "Termina antes de...") configurados por el usuario para extraer campos clave (Nº Pedido, Fecha, Cliente).
*   **Import Logic**: Reutilización de `pedidosImportService.js` para la creación final de pedidos, asegurando que las validaciones de negocio (duplicados, clientes nuevos) sean idénticas a la carga de Excel.

### 3.3. Endpoints API
*   `POST /api/pdf/upload`: Sube el archivo, lo guarda y devuelve el texto extraído y una vista previa.
*   `POST /api/pdf/preview-extraction`: Recibe el ID del archivo y una configuración de mapeo; devuelve los datos estructurados simulados.
*   `POST /api/pdf/configs`: CRUD para guardar/cargar configuraciones de mapeo.
*   `POST /api/pdf/import`: Ejecuta la importación final de los datos validados.

## 4. Desarrollo Frontend (UI/UX)
### 4.1. Componente `PdfImportModal`
Un nuevo modal accesible desde la lista de pedidos, con un flujo de 3 pasos:

*   **Paso 1: Carga y Selección de Formato**
    *   Área de "Drag & Drop" para el PDF.
    *   Selector de "Configuración de Mapeo" (ej. "Usar formato guardado 'Cliente X'" o "Nuevo Mapeo").

*   **Paso 2: Configuración de Mapeo (Si es nuevo)**
    *   **Panel Izquierdo**: Texto crudo extraído del PDF.
    *   **Panel Derecho**: Formulario de campos del sistema (Cliente, Pedido, Fecha, Items).
    *   **Interacción**: El usuario define "Marcadores" (Texto inicial/final) para cada campo basándose en el texto del PDF.
    *   *Funcionalidad Clave*: Botón "Probar Mapeo" que actualiza la vista previa de datos en tiempo real.

*   **Paso 3: Revisión y Confirmación**
    *   Tabla similar a la de Excel (`BulkImportModalV2`) mostrando los datos extraídos.
    *   Celdas editables para correcciones manuales rápidas.
    *   Indicadores de validación (fechas inválidas, campos obligatorios faltantes).
    *   Botón final "Importar Pedidos".

## 5. Integración y Pruebas
*   **Integración**: Conectar el botón "Importar PDF" en el `Header` o `BulkActionsToolbar`.
*   **Testing**:
    *   Usar los archivos de `pedidos-pdf/` como casos de prueba.
    *   Verificar que un PDF del "Cliente A" se procese correctamente con su configuración guardada.
    *   Validar que el archivo físico se guarde en la ruta correcta.

## Paso a Paso de Ejecución
1.  **Backend**: Instalar dependencias y configurar servidor (Multer).
2.  **BD**: Crear tablas de configuración.
3.  **Backend**: Implementar endpoints de subida y extracción básica.
4.  **Frontend**: Crear UI de subida y visualización de texto.
5.  **Fullstack**: Implementar lógica de mapeo dinámico (Backend aplica reglas, Frontend las define).
6.  **Fullstack**: Conectar flujo de importación final (Crear pedidos).
7.  **Refinamiento**: Pruebas con los PDFs de ejemplo y ajustes de UX.
