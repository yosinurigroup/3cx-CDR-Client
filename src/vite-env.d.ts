/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly NODE_ENV: 'development' | 'production' | 'test'
  readonly PROD: boolean
  readonly DEV: boolean
  readonly MODE: string
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}