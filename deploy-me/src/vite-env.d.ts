/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZEGOCLOUD_APP_ID: string
  readonly VITE_ZEGOCLOUD_SERVER_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
