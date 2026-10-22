# Tayyar

**A download manager that uses every connection you have.**

Tayyar splits a file into blocks and pulls them over Wi-Fi, Ethernet, USB tethering and mobile
data at the same time — then adds the things people expect from a serious download manager:
dynamic segmentation, resume after a crash, a scheduler, categories, browser capture, torrents
and optional virus scanning.

A fork of [Plexo](https://github.com/anmolkapil/plexo) (MIT), rebuilt as a Windows desktop app and
extended for maximum throughput. See [NOTICE.md](NOTICE.md) for what changed.

## Features

**Speed**
- Dynamic segmentation: 8 streams per network at start, growing to 32 (64 in Turbo mode) as the
  server and the disk keep up. Blocks are pulled from a shared queue, so a faster network simply
  takes more of them.
- Multi-network aggregation: each stream is bound to one interface (Wi-Fi, Ethernet, USB tethering,
  mobile), so the file arrives over all of them at once.
- Slow-block racing near the end, connection reuse, keep-alive, and per-server backoff.
- Turbo mode: 16–64 streams per network and 4 MB blocks, for servers that can take it.

**Reliability**
- Resume across restarts, sleep/wake reconnection, expired-link replacement without losing bytes.
- ETag / Last-Modified validation so a file republished mid-download is never stitched together
  from two versions.
- Sparse pre-allocation, per-block checkpoints, and a publish step that never leaves a half file
  under the final name.

**Control**
- Queues, concurrent-download limits, per-network speed caps and data budgets (daily/weekly/monthly).
- Download schedule by time and day.
- Categories: finished files are sorted into Video, Audio, Programs, Documents, Archives, Images.
- Optional Windows Defender scan of each finished file.
- Optional clipboard capture: copy a file link, and it opens in New download.
- Optional shutdown when the queue finishes.

**Browser**
- Extension (Chromium and Firefox) hands downloads to the app with the browser's cookies, so
  signed-in downloads work.

## Build

Requires Node.js 22+ on Windows.

```powershell
npm install
npm run build:win
```

The installer lands in `dist/` as `tayyar-<version>-setup.exe`.

Icons are generated from `scripts/make-icons.py` (Python 3 + Pillow):

```powershell
python scripts/make-icons.py
```

## License

MIT. Tayyar keeps Plexo's copyright notice — see [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).

Not affiliated with Internet Download Manager or Tonec Inc.
