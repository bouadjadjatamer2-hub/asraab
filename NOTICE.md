# NOTICE

Majra is a fork of **Plexo** (https://github.com/anmolkapil/plexo), © 2026 Anmol Kapil,
licensed under the MIT License. The original copyright notice is kept in [LICENSE](LICENSE).

Changes made for Majra:

- Rebranded the application, installer, icons and browser extension.
- Added a Turbo mode that raises segmentation and stream counts for maximum throughput.
- Added automatic folder organization for finished downloads (IDM-style categories).
- Added optional Windows Defender scanning of completed files.
- Added clipboard link capture and a "shut down when the queue finishes" action.
- Added extract-while-downloading for RAR, ZIP and TAR archives: the archive is unpacked as it
  arrives, so disk use ends at the unpacked files instead of archive plus extraction.
- Removed the release update feed: this build is distributed as a standalone installer.

Plexo's MIT license permits these changes and commercial distribution, provided the original
copyright notice and permission notice are retained. Majra keeps them.

## Bundled tools

`resources/bin/unrar.exe` is the console **UnRAR** extractor from WinRAR
(https://www.rarlab.com), © 1993–2023 Alexander Roshal. UnRAR is freeware; its license permits
redistribution with software that uses it to handle RAR archives and forbids reverse-engineering
the RAR compression algorithm. Majra runs it only to unpack RAR files the user downloads. The
license text that ships with it is at `resources/bin/UNRAR-LICENSE.txt`.

ZIP archives are unpacked in-process by **unzipper** (https://github.com/ZJONSSON/node-unzipper),
© Ziggy Jonsson, MIT licensed.

**Not affiliated with, endorsed by, or derived from Internet Download Manager (Tonec).**
IDM is a trademark of its owner; Majra only implements equivalent, independently written
download features.
