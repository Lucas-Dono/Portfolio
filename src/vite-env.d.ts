/// <reference types="vite/client" />

interface ImportMeta {
    readonly env: {
        readonly VITE_API_URL?: string;
        readonly VITE_MP_PUBLIC_KEY?: string;
        readonly VITE_CORS_FRONT?: string;
        readonly VITE_CORS_BACK?: string;
        readonly VITE_GOOGLE_CLIENT_ID?: string;
        readonly VITE_GITHUB_CLIENT_ID?: string;
        readonly MODE?: string;
        [key: string]: any;
    }
}
