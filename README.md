<p align="center">
  <img src="docs/assets/img/majra-icon.png" width="80" alt="Majra app icon" />
</p>

<h1 align="center">Majra</h1>

<p align="center">
  <strong>Every link lands here.</strong><br />
  A free, open-source Windows download manager that puts Wi-Fi, Ethernet, USB tethering and mobile data to work on the same file.
</p>

<p align="center">
  <a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/"><img src="docs/assets/img/asraab-mark.svg" width="14" alt="" /> Part of <strong>Asraab</strong></a> — a small, hand-picked catalog of independent Windows apps.
</p>

<p align="center">
  <a href="https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases/download/v1.2.2/Majra-1.2.2-Setup.exe"><img src="https://img.shields.io/badge/Download_for_Windows-v1.2.2-B45309?style=for-the-badge&amp;logo=windows&amp;logoColor=white" alt="Download Majra 1.2.2 for Windows" /></a>
  <a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/"><img src="https://img.shields.io/badge/Asraab-website-1F7D5C?style=for-the-badge" alt="Open the Asraab website" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-4CC38A?style=for-the-badge" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/">Asraab</a> ·
  <a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/apps/majra/">Majra page</a> ·
  <a href="https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases/download/v1.2.2/Majra-1.2.2-Setup.exe">Download</a> ·
  <a href="https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases/download/v1.2.2/Majra-Browser-Extension.zip">Browser extension</a> ·
  <a href="https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases/tag/v1.2.2">Release notes</a> ·
  <a href="https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/issues">Issues</a>
</p>

<a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/"><img src="docs/og.png" alt="Majra — one download over every connection" width="100%" /></a>

Majra splits files into blocks and binds each stream to a network interface, so a download can use Wi-Fi, Ethernet and USB tethering at the same time. It also resumes interrupted transfers, schedules downloads, extracts archives while they arrive, captures links from the browser, handles torrents, and can scan finished files with Windows Defender.

Majra is built for real-world links: signed-in pages, byte-range servers, very large archives, and connections that come and go. It is free, open source, and has no account or bundled adware.

> [!NOTE]
> “Every connection” means every network interface Windows exposes. Majra cannot create bandwidth that is not there: two connections behind the same router often share one uplink, and servers without byte-range support fall back to a single stream.

Asraab is a curated, owner-maintained catalog. There is no public submission form, account system or web admin panel. Adding an app is a maintainer-only change to [`docs/assets/apps.js`](docs/assets/apps.js) plus a page under `docs/apps/<slug>/`. The homepage’s “coming soon” card is editorial, not an invitation to submit an app.

---

## Screenshots

### The website

The [Asraab catalog](https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/) is bilingual and theme-aware. The [Majra page](https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/apps/majra/) keeps the installer, extension ZIP and checksum together, and sends both downloads straight to your browser — no release-page detour.

[![Asraab catalog — dark desktop view](docs/screenshots/website-desktop.png)](https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/)

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/apps/majra/"><img src="docs/screenshots/website-arabic.png" alt="Majra page in Arabic with the light theme" /></a>
    </td>
    <td width="50%" valign="top">
      <a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/apps/majra/#download"><img src="docs/screenshots/website-download.png" alt="Majra download page with the installer, release details and SHA-256 checksum" /></a>
    </td>
  </tr>
  <tr>
    <td align="center"><sub>Arabic · light theme</sub></td>
    <td align="center"><sub>Direct download</sub></td>
  </tr>
</table>

<p align="center">
  <a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/"><img src="docs/screenshots/website-mobile.png" width="300" alt="Asraab catalog on a phone" /></a><br />
  <sub>Mobile</sub>
</p>

### The app

[![Majra downloading one file over Wi-Fi, USB tethering and Ethernet](docs/screenshots/app-detail.png)](docs/screenshots/app-detail.png)

<sub>Captured from the real app; the three network interfaces are simulated for the screenshot. One file, three connections, one progress bar.</sub>

---

## What it does

### Use every connection

- **Interface-bound streams.** Each worker is bound to one network interface, so Wi-Fi, Ethernet, USB tethering and mobile data can feed the same download at once.
- **Dynamic segmentation.** Starts at 8 streams per network and grows to 32 while the server and disk keep up. Turbo mode goes further, with up to 64 streams per network and 4 MB blocks.
- **A shared work queue.** Faster networks take more blocks automatically instead of waiting for a slower one.
- **Range-aware fallback.** If a server does not support byte ranges, Majra uses a single connection instead of pretending to split the file.

### Built to finish

- **Resume across restarts** and sleep/wake, with per-block checkpoints and an expired-link replacement flow that does not throw away downloaded bytes.
- **Version checks.** ETag and Last-Modified validation stop a file republished mid-download from being stitched together from two versions.
- **Safe publish.** Data is written to a preallocated staging file and only moved to the final name after validation, so a half-finished download never looks complete.
- **Any size.** A 1 KB file and a multi-terabyte archive take the same path; there is no minimum or maximum download size.
- **Extract while downloading.** ZIP, RAR and TAR archives — including `.tar.gz`, `.tar.bz2` and `.tar.xz` — unpack as they arrive, avoiding a second full-size copy on disk.
- **Optional Windows Defender scan** of each finished file.
- **Automatic updates.** Packaged builds check GitHub Releases at launch and every few hours, then download a newer version in the background and install it on restart.

### Stay in control

- Queues, concurrent-download limits, per-network speed caps and daily/weekly/monthly data budgets.
- Download schedules by time and day, plus automatic categories for Video, Audio, Programs, Documents, Archives and Images.
- Arabic and English, with a fully right-to-left Arabic layout, Arabic plurals and dates, and a one-click switch that survives a restart.
- Clipboard capture, tray support, start with Windows, and optional shutdown when the queue finishes.
- Browser handoff with cookies included, so signed-in downloads work.
- Torrents from magnet links or `.torrent` files, with the same queue and history.

---

## How it works

1. **Probe the link.** Majra reads the response headers, filename, size, range support and validators.
2. **Plan the blocks.** The file becomes a queue of byte ranges sized for the connection and disk.
3. **Bind and pull.** Each request is bound to a chosen interface. Auto keeps a stable count (8 streams per network, 4 on a hard disk) instead of growing until the link collapses; Turbo is the explicit opt-in to more.
4. **Assemble and publish.** Blocks land in a preallocated staging file, get verified, and are renamed only after the download is whole.

When an archive is being extracted, completed blocks are fed to the extractor as soon as their data is available. The download and extraction share the same progress state, so pause, resume and cancel still behave normally.

---

## Download

**Windows 10 / 11 · 64-bit · v1.2.2 · 125.3 MB**

[**Download Majra-1.2.2-Setup.exe**](https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases/download/v1.2.2/Majra-1.2.2-Setup.exe) · [Release notes](https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases/tag/v1.2.2) · [All releases](https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases)

|                      |                                     |
| -------------------- | ----------------------------------- |
| **Version**          | 1.2.2                               |
| **Platform**         | Windows 10 / 11, 64-bit             |
| **Installer**        | `Majra-1.2.2-Setup.exe` · 125.3 MB |
| **License**          | MIT                                 |
| **Account required** | No                                  |

### What's new in 1.2.2

- Archive extraction now survives names Windows cannot normally create: reserved names, trailing dots or spaces, overlong names, and Unicode collisions are made safe without losing files.
- Extraction errors now report the real reason (bad archive, unsupported method, disk write failure) instead of a generic “tool stopped”.
- Torrents work in packaged builds again: the peer and WebTorrent patches are applied before every test and build.
- A new stream-drop identity, calmer warm palette, and short compositor-only animations. Low-power machines and reduced-motion users automatically get a still interface.

> [!WARNING]
> The installer is not code-signed, so Windows SmartScreen may show a warning. Choose **More info → Run anyway**, or build from source. The project does not have a code-signing certificate yet.

<details>
<summary>Verify the SHA-256 checksum</summary>

```powershell
Get-FileHash .\Majra-1.2.2-Setup.exe -Algorithm SHA256
```

Expected:

```text
DDBB1E8BE18ABBD991FAF2103A079DA1F0632502F054BC5248914A5918180D4F
```

</details>

---

## Browser extension (optional)

[**Download Majra-Browser-Extension.zip**](https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases/download/v1.2.2/Majra-Browser-Extension.zip) · [Privacy policy](https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/extension/privacy/)

The Chromium extension hands downloads to Majra with the browser's cookies, so signed-in files work. It supports Chrome, Edge, Brave and Opera.

1. Download the ZIP and extract it somewhere you will remember.
2. Open your browser's extensions page — `chrome://extensions` in Chrome, `edge://extensions` in Edge.
3. Turn on **Developer mode**, choose **Load unpacked**, and select the extracted folder. `manifest.json` sits at its root.
4. Keep Majra running, then use the toolbar button or the right-click menu.

> [!NOTE]
> This is a manual install and is not on the Chrome Web Store yet, so the browser will not update it automatically. Re-download the ZIP when a new release lands. The extension only talks to Majra on `127.0.0.1`; there are no developer servers.

---

## Privacy

There is no account, no advertising and no analytics. Majra talks only to the URLs you give it, and the extension talks only to the app on your computer. Download history and settings stay on your PC. The [extension privacy policy](https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/extension/privacy/) has the details.

---

## Build from source

**Requirements:** Node.js 22+ and npm 9+. Build the Windows installer on Windows.

```powershell
git clone https://github.com/bouadjadjatamer2-hub/Majra-download-manager-.git
cd Majra-download-manager-
npm ci
npm run dev
```

Create the Windows installer:

```powershell
npm run build:win
```

The installer is written to `dist/` and is unsigned unless you provide signing credentials. Build the browser extension with:

```powershell
npm run build:extension
```

That writes `extension/dist/chrome` and `extension/dist/firefox`. Before opening a pull request, run:

```powershell
npm run lint
npm run typecheck
npm run format:check
```

The desktop app is Electron + React + TypeScript. The browser extension is Manifest V3, the site is static HTML/CSS/JS in `docs/`, and Playwright end-to-end tests live in `e2e/`.

---

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup and test commands, open an issue before a large change, and describe the network setup you tested — which interfaces, URL and file size.

---

## Credits

Majra is a fork of [Plexo](https://github.com/anmolkapil/plexo) by Anmol Kapil, used under the MIT License. Plexo's copyright and permission notice are retained in [LICENSE](LICENSE); the changes made for Majra are listed in [NOTICE.md](NOTICE.md).

Bundled tools and their licenses — including UnRAR and `unzipper` — are also listed in [NOTICE.md](NOTICE.md). Not affiliated with, endorsed by, or derived from Internet Download Manager (Tonec Inc.).

## License

[MIT](LICENSE) © 2026 Majra contributors.

---

<h2 dir="rtl" align="right">بالعربية</h2>

<p dir="rtl" align="right">
  <strong>مجرى</strong> مدير تحميل مجاني ومفتوح المصدر لنظام ويندوز 10/11. يوزّع الملف الواحد على Wi-Fi والإيثرنت وUSB في الوقت نفسه، مع استئناف التحميل بعد إغلاق التطبيق، والجدولة، واستخراج الأرشيف أثناء التنزيل، والتقاط الروابط من المتصفح.
</p>

<p dir="rtl" align="right">
  <a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/">موقع أسراب</a> ·
  <a href="https://bouadjadjatamer2-hub.github.io/Majra-download-manager-/apps/majra/">صفحة مجرى</a> ·
  <a href="https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases/download/v1.2.2/Majra-1.2.2-Setup.exe">تحميل الإصدار 1.2.2</a> ·
  <a href="https://github.com/bouadjadjatamer2-hub/Majra-download-manager-/releases/download/v1.2.2/Majra-Browser-Extension.zip">إضافة المتصفح</a>
</p>

<p dir="rtl" align="right">مجرى هو أول تطبيق في كتالوج أسراب، والمزيد في الطريق. الموقع متوفر بالعربية والإنجليزية.</p>
