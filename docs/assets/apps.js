/* Asraab catalog data.
 *
 * Owner-managed on purpose. Adding an app means adding one object here in the
 * repository; the public site exposes no submission form, admin panel or
 * catalog-editing controls. The app itself lives at `href`; its direct
 * downloads stay on that app page so the catalog never becomes a pile of
 * release links.
 *
 * `name`, `category`, `tagline`, `description`, `statusLabel`, `platform` and
 * `actionLabel` accept either a string or an { en, ar } object.
 */
window.ASRAAB_APPS = [
  {
    slug: 'tayyar',
    name: { en: 'Tayyar', ar: 'تيار' },
    category: { en: 'Download manager', ar: 'مدير تحميل' },
    tagline: { en: 'Every connection. One download.', ar: 'كل اتصالاتك. تحميل واحد.' },
    description: {
      en: 'Splits a download across Wi-Fi, Ethernet and USB at the same time, with resume, queues, and extract-while-downloading.',
      ar: 'يقسّم التحميل بين Wi-Fi والإيثرنت وUSB في الوقت نفسه، مع الاستكمال والطوابير وفكّ الضغط أثناء التنزيل.'
    },
    actionLabel: { en: 'Meet Tayyar', ar: 'تعرّف على تيار' },
    status: 'live',
    statusLabel: { en: 'Live', ar: 'متاح' },
    platform: { en: 'Windows 10/11', ar: 'ويندوز 10/11' },
    version: '1.2.1',
    size: '125.3 MB',
    license: 'MIT',
    href: './apps/tayyar/',
    icon: './assets/img/tayyar-icon.png',
    repo: 'https://github.com/bouadjadjatamer2-hub/tayyar-download-manager-'
  }
]

window.ASRAAB_CATALOG = {
  updated: '2026-10-23'
}
