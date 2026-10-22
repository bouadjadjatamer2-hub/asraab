import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, Menu, nativeImage, nativeTheme, shell, Tray } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon-dark.png?asset'
import { registerIpcHandlers } from './ipc/handlers'
import { startBridge } from './browserBridge'
import { acceptedLink, bringForward, linkFromArgs, offerLink } from './openLinks'
import {
  loadSettings,
  loadThemeSource,
  migrateLegacyNetworkPreferences,
  saveSettings
} from './settings'
import { setClipboardWatch } from './clipboardWatch'
import {
  applyStartAtLogin,
  BACKGROUND_FLAG,
  keepsRunningInBackground,
  launchedInBackground,
  setRunInBackground
} from './startup'
import { testKnobs } from './testKnobs'
import type { DownloadManager } from './download/downloadManager'

// In dev mode the app runs as the raw `electron` binary, which otherwise shows "Electron" in
// the Dock tooltip/menu bar — must be set before the app is ready. Packaged builds already get
// this from electron-builder's productName, but setting it here keeps dev and packaged in sync.
app.setName('Tayyar')

// Each e2e test runs against its own throwaway userData folder (downloads, manifests, settings).
if (testKnobs.userDataDir) app.setPath('userData', testKnobs.userDataDir)

// One Tayyar at a time (per userData folder, so parallel e2e runs each have their own): a second
// launch — a magnet link clicked, a .torrent opened — hands its link to the first and exits.
if (!app.requestSingleInstanceLock()) app.exit(0)

let mainWindow: BrowserWindow | null = null
let downloadManager: DownloadManager | null = null
let quitAfterSuspending = false
let tray: Tray | null = null
// The login item passes this flag; a normal double-click does not, so it still opens the window.
const startsInBackground = launchedInBackground()

/** Only once the app is ready. */
function ensureWindow(): BrowserWindow {
  if (!mainWindow || mainWindow.isDestroyed()) createWindow()
  return mainWindow as BrowserWindow
}

/** A link the OS handed over goes to the window's link field (see openLinks.ts). */
function offer(candidate: string): void {
  const link = acceptedLink(candidate)
  if (!link) return
  // Before the app is ready the link waits; the window takes it once it opens.
  offerLink({ url: link }, app.isReady() ? ensureWindow() : null)
}

// A tayyar:// link from the browser extension arrives here too, with no link in it.
app.on('second-instance', (_event, argv) => {
  const link = linkFromArgs(argv)
  if (link) return offer(link)
  // A login item firing while Tayyar is already open must not pop the window over the desktop.
  if (argv.includes(BACKGROUND_FLAG)) return
  bringForward(ensureWindow())
})
// macOS hands links over as events, and may do so before the app is ready.
app.on('open-url', (event, url) => {
  event.preventDefault()
  offer(url)
})
app.on('open-file', (event, path) => {
  event.preventDefault()
  offer(path)
})
// Windows and Linux put the first launch's link on its command line.
const launchLink = linkFromArgs(process.argv)
if (launchLink) offer(launchLink)

/** The Windows/Linux window controls, in the title bar's colors (main.css's --bg-secondary and
 * --text) for the theme in use, at its height. */
function titleBarOverlay(): Electron.TitleBarOverlayOptions {
  const dark = nativeTheme.shouldUseDarkColors
  return {
    color: dark ? '#202325' : '#fafafa',
    symbolColor: dark ? '#eae7e2' : '#1d1d1f',
    height: 44
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 760,
    height: 640,
    minWidth: 720,
    // Room under the download screen's pinned block grid for a network row and a few of its rows.
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    title: 'Tayyar',
    // Matches the renderer's dark-mode background so a live window resize
    // (which briefly exposes the raw window background) doesn't flash white.
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#ffffff',
    ...(process.platform !== 'darwin' ? { icon } : {}),
    // One title bar on every OS: the renderer's own strip (see TitleBar.tsx), with the OS's
    // window controls over it — macOS's traffic lights, or the minimize/maximize/close that
    // Windows and Linux draw over the strip's right end.
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin'
      ? // Center the 14px native buttons in the renderer’s 32px macOS title bar.
        { trafficLightPosition: { x: 16, y: 9 } }
      : { titleBarOverlay: titleBarOverlay() }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // A hidden e2e window would otherwise have its timers throttled.
      backgroundThrottling: !testKnobs.hideWindow
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (!testKnobs.hideWindow) mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Only hand http(s) links to the OS shell — an arbitrary scheme (e.g. a custom protocol
    // handler) reaching shell.openExternal is a known Electron risk if this ever fires with
    // attacker- or server-influenced data.
    if (/^https?:/i.test(details.url)) void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Electron shows no right-click menu of its own: give every text field Cut/Copy/Paste, and any
  // selected text Copy.
  mainWindow.webContents.on('context-menu', (_, { isEditable, selectionText, editFlags }) => {
    const template: Electron.MenuItemConstructorOptions[] = isEditable
      ? [
          { role: 'cut', enabled: editFlags.canCut },
          { role: 'copy', enabled: editFlags.canCopy },
          { role: 'paste', enabled: editFlags.canPaste },
          { type: 'separator' },
          { role: 'selectAll', enabled: editFlags.canSelectAll }
        ]
      : selectionText.trim()
        ? [{ role: 'copy' }]
        : []
    if (template.length) Menu.buildFromTemplate(template).popup()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** The tray is the app's home once the window is closed or a login launch starts hidden. */
function createTray(): Tray {
  if (tray) return tray
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))
  tray.setToolTip('Tayyar')
  tray.on('click', () => bringForward(ensureWindow()))
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Tayyar', click: () => bringForward(ensureWindow()) },
      { type: 'separator' },
      { label: 'Quit Tayyar', click: () => app.quit() }
    ])
  )
  return tray
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('app.tayyar.desktop')

  // A failed move keeps the old file, to retry next launch — it must never stop the window opening.
  await migrateLegacyNetworkPreferences().catch((error) =>
    console.error('[plexo] failed to migrate network-preferences.json', error)
  )

  // The macOS About window (Tayyar › About Tayyar); its copyright comes from electron-builder.yml.
  app.setAboutPanelOptions({
    credits:
      'Tayyar — download with every connection you have.\nBased on Plexo by Anmol Kapil (MIT).'
  })

  // Applied before the window is created so the initial background/icon already match —
  // the saved preference otherwise only takes effect on the next 'updated' event.
  nativeTheme.themeSource = await loadThemeSource()

  const settings = await loadSettings()
  // First run of an install that has no saved choice yet: register the Task Manager → Startup
  // entry once. Later launches leave it alone, so disabling it there sticks.
  if (settings.startAtLogin === undefined) {
    applyStartAtLogin(true)
    await saveSettings({ startAtLogin: true }).catch((error) =>
      console.error('[plexo] failed to save the startup preference', error)
    )
  }
  setRunInBackground(settings.runInBackground ?? true)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  downloadManager = registerIpcHandlers(() => mainWindow)
  void startBridge({
    manager: downloadManager,
    offer: (link) => offerLink(link, ensureWindow())
  }).catch((error) => console.error('[plexo] browser bridge failed to start', error))
  // Unlike magnet:, tayyar:// is Tayyar's own, so registering it takes nothing from another app. A
  // development build has no fixed path to register.
  if (app.isPackaged) app.setAsDefaultProtocolClient('tayyar')

  nativeTheme.on('updated', () => {
    mainWindow?.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#ffffff')
    if (process.platform !== 'darwin') mainWindow?.setTitleBarOverlay(titleBarOverlay())
  })

  // A login launch waits in the tray. Any later open (tray click, second launch, extension link)
  // creates the window through ensureWindow().
  if (startsInBackground) createTray()
  else createWindow()
  if (testKnobs.hideWindow) app.dock?.hide()
  // Clipboard capture is opt-in; it only ever fills the link field, never starts a download.
  void setClipboardWatch(settings.clipboardWatch === true, (url) =>
    offerLink({ url }, ensureWindow())
  )
  // Updates ship by installer for now: there is no release feed for this build to check.

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) bringForward(ensureWindow())
  })
})

app.on('before-quit', (event) => {
  if (quitAfterSuspending || !downloadManager) return

  event.preventDefault()

  // Guarantee the process exits even if suspending hangs
  const forceQuitTimeout = setTimeout(() => {
    app.exit(0)
  }, 3000)

  void downloadManager.suspendAll().finally(() => {
    clearTimeout(forceQuitTimeout)
    quitAfterSuspending = true
    app.exit(0)
  })
})

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') return
  // Closing the window normally only hides the app: downloads, the browser bridge and the
  // scheduler keep going. Quit from the tray menu to stop everything. An explicit opt-out
  // wins over the browser-bridge fallback, so turning the setting off really quits.
  if (!keepsRunningInBackground()) return app.quit()
  createTray()
})
