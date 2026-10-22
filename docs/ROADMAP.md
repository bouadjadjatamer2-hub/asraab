# Roadmap

What Tayyar 1.0 has, and what comes next. Ordered by value for the next release, not by effort.

## 1.0 (this build)

- Dynamic segmentation (8 → 32 streams per network, 64 in Turbo)
- Multi-network aggregation over Wi-Fi, Ethernet, USB tethering and mobile
- Torrents and magnets, resume across restarts, scheduler
- Categories, Defender scan, clipboard capture, shutdown when finished
- Browser hand-off (extension source in `extension/`)

## 1.1 — media

- **Media sniffer**: the extension reports HLS/DASH manifests, the app downloads the segments and
  remuxes with ffmpeg. Needs a bundled ffmpeg build and a licence note (LGPL builds only).
- **Download all links from a page**: extension collects links, app shows a picker with filters
  (extension, size, same-site only).
- **Batch URL input**: paste N links, one row each, start them together.

## 1.2 — protocols and migration

- **FTP / FTPS**: IDM still supports it; a segmented FTP reader is the missing piece.
- **Import**: IDM's list (registry + its data folder), Free Download Manager's `.fdm` list, aria2's
  `.aria2` control files, and a plain URL list.
- **Metalink** (`.meta4`): multiple sources per file, checksums included.
- **Checksum verification**: MD5/SHA-1/SHA-256 typed or taken from a `.sha256` next to the link.

## 1.3 — distribution

- **Code signing** (EV certificate) so SmartScreen stops warning.
- **Auto-update**: GitHub Releases feed, `latest.yml`, signature check.
- **Portable build** (no installer) and a winget manifest.

## 2.0 — power features

- **Site grabber**: crawl a site with depth/extension/size filters, resume like a normal download.
- **Remote control**: local HTTP API + a small web UI, so a phone can queue downloads.
- **Rules**: per-site destination, per-site connections, per-site proxy.
- **Proxy support**: HTTP/SOCKS5, per download.

## Deliberately not planned

- DRM circumvention of any kind.
- Bundled adware, toolbars, or a "download accelerator" that only renames the browser's download.
- Copying IDM's code, assets or trade dress. Features are reimplemented from public specifications
  (RFC 9110 ranges, BitTorrent BEPs, HLS/DASH).
