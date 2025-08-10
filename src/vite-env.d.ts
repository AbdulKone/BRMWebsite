/// <reference types="vite/client" />

// Déclaration explicite pour TypeScript 5.9.2
declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_HUNTER_API_KEY: string;
    readonly VITE_RECAPTCHA_SITE_KEY: string;
    readonly VITE_N8N_WEBHOOK_SECRET: string;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly SSR: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Export pour s'assurer que le module est traité
export {};