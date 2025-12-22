/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Variables globales inyectadas por Vite
declare const __BUILD_TIME__: string;
declare const __APP_VERSION__: string;
