/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend manzili. Boʻsh boʻlsa panel soʻrov yubormaydi. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
