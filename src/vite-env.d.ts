/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXCHANGE_RATE_PROVIDER?: string;
  readonly VITE_EXCHANGE_RATE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
