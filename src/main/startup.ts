import { app } from 'electron'

/** Passed by the login item so launch-at-login starts in the tray instead of opening a window. */
export const BACKGROUND_FLAG = '--background'

// Kept in main so window-all-closed can answer synchronously. It follows the saved setting and
// defaults to on: closing the window must not stop downloads the user left running.
let runInBackground = true

/** Whether closing the last window should leave Majra in the tray. */
export function keepsRunningInBackground(): boolean {
  return runInBackground
}

export function setRunInBackground(enabled: boolean): void {
  runInBackground = enabled
}

/** True for the launch the OS made from the login item, rather than one the user started. */
export function launchedInBackground(): boolean {
  return process.argv.includes(BACKGROUND_FLAG)
}

/**
 * Adds or removes Majra's entry in Windows Task Manager → Startup (the per-user Run key).
 * The entry passes BACKGROUND_FLAG, so signing in leaves the app in the tray.
 *
 * Only packaged builds have a stable executable path to register; development and e2e runs
 * must never touch the real login items.
 */
export function applyStartAtLogin(enabled: boolean): void {
  if (!app.isPackaged) return
  try {
    if (process.platform === 'win32') {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        name: 'Majra',
        path: process.execPath,
        args: [BACKGROUND_FLAG]
      })
      return
    }
    if (process.platform === 'darwin') {
      app.setLoginItemSettings({ openAtLogin: enabled })
    }
  } catch (error) {
    // A locked-down machine may refuse the login-item write; startup should still open the app.
    console.error('[plexo] failed to update the login item', error)
  }
}
