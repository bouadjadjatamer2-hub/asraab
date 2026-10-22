import type { TayyarApi } from './index'

declare global {
  interface Window {
    plexo: TayyarApi
  }
}
