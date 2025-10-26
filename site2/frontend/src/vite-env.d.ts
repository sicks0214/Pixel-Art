/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_NODE_ENV: string
  readonly VITE_ENABLE_MOCK_MODE: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_BUILD_SOURCEMAP: string
  readonly VITE_BUILD_MINIFY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
