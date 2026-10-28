# Contributing to Majra

Thanks for helping. Majra is a small, Windows-first project; focused changes are easier to review than broad rewrites.

## Setup

Requires Node.js 22.13+ and npm 9+.

```powershell
git clone https://github.com/bouadjadjatamer2-hub/asraab.git
cd asraab
npm ci
npm run dev
```

`npm ci` also installs Electron and rebuilds native dependencies. For static checks only, `npm ci --ignore-scripts` is enough.

## Building

Create the Windows installer:

```powershell
npm run build:win
```

The result is written to `dist/` and is unsigned unless signing credentials are configured.

Build the browser extension:

```powershell
npm run build:extension
```

Load `extension/dist/chrome` from `chrome://extensions` (Developer mode → **Load unpacked**). For Firefox, load `extension/dist/firefox/manifest.json` from `about:debugging#/runtime/this-firefox`. Keep Majra running while testing download capture.

## Before opening a PR

```powershell
npm run lint
npm run typecheck
npm run format:check
```

The end-to-end suite builds and launches the real app against a local test server:

```powershell
npm run test:e2e:smoke
```

On Linux, Electron needs a display even with its window hidden. Use:

```bash
xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24 -noreset" npm run test:e2e:smoke
```

The suite is still being stabilized. If a test fails, report the seed and scenario rather than weakening an assertion. Known bugs may be marked with `test.fail(...)`; remove the marker when the fix lands.

## What to include in a PR

- Keep one fix or feature per PR.
- Explain changes to `src/main/download/` or `src/main/network/` carefully. Resume, retry and stall handling exist to prevent silent data corruption, so tradeoffs matter.
- For UI changes, include a screenshot or short recording.
- Describe how you tested it: interfaces used, URL, file size, whether the server supported ranges, and what happened after pause/resume.
- Do not commit generated `out/`, `dist/`, or `test-results/` content.
- Contributions are accepted under the MIT License, with Plexo's original copyright notice retained.

## Reporting bugs

Open an issue with:

- Windows version and Majra version.
- The URL (if public) or roughly what it served, plus file size and server type.
- Which network interfaces were involved.
- The exact steps, expected result and actual result.
- Console output or crash details if available.

For feature requests, open an issue before writing a lot of code — especially for anything touching chunking, resume or the scheduler.
