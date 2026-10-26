import type { MajraApi } from './index'

declare global {
  interface Window {
    plexo: MajraApi
  }
}
