# Rebuilding Tayyar

This folder holds the source of **Tayyar 1.2.0**. `node_modules`, `out` and `dist` were removed to
save space; everything below recreates them.

## Requirements

- Windows 10/11 x64
- Node.js 22+ and npm
- Internet access for the first install (Electron binaries included via `postinstall`)

## Build the installer

```bat
cd <this folder>
npm install
npx electron-vite build
npx electron-builder --win --publish never
```

The installer lands in `dist\tayyar-1.2.0-setup.exe`. It is not code-signed, so Windows
SmartScreen will warn on first run.

`npm install` runs the repo's `postinstall` (`patch-package`, `install-electron`,
`electron-builder install-app-deps`), which fetches the Electron runtime used for packaging.

## Build the browser extension

```bat
npm run build:extension
```

The zip is written next to the project as `Tayyar-Browser-Extension.zip` (Chrome: `chrome://extensions`
→ Developer mode → Load unpacked → the unzipped folder).

## Checks

```bat
npm run typecheck
npm test            :: unit tests, if configured
npm run test:e2e    :: Playwright end-to-end
```

Ad-hoc checks used during development live in `scripts\check-*.mjs` and run with plain `node`.

## Notes

- Product name: **Tayyar**; app id `app.tayyar.desktop`; protocol `tayyar://`.
- HTTP downloads normally go through Node's stack with per-interface binding (multi-network).
- When a server refuses Node's TLS handshake (e.g. Cloudflare returns 403), the probe retries via
  Chromium's stack and records `transport: 'chromium'`; the download follows the same route
  (`src\main\download\chromiumConnection.ts`).
- Web page URLs are rejected with a "this is a web page, not a file" message.
- Extract while downloading: the archive is unpacked as its bytes arrive, so a 50 GB archive
  needs only the unpacked files' space, not archive plus extraction. RAR uses the bundled
  `resources\bin\unrar.exe` (`x -si`), TAR uses Windows' `tar.exe`, and ZIP uses `unzipper` in
  process. These run on one connection. Pausing or losing the run starts the unpacking download
  over from byte 0, because an extractor cannot resume in the middle of an archive. 7z and
  multi-part archives are not streamed.
- Internal identifiers (`window.plexo`, `plexoApi`, `.plexo` staging suffix) are kept on purpose.
- Upstream: Plexo (MIT). See `NOTICE`/`LICENSE` for attribution.
