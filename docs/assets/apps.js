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
    slug: 'majra',
    name: { en: 'Majra', ar: 'مجرى' },
    category: { en: 'Download manager', ar: 'مدير تحميل' },
    tagline: { en: 'Every link lands here.', ar: 'كل رابط يهبط هنا.' },
    description: {
      en: 'Splits a download across Wi-Fi, Ethernet and USB at the same time, with resume, queues, and extract-while-downloading.',
      ar: 'يقسّم التحميل بين Wi-Fi والإيثرنت وUSB في الوقت نفسه، مع الاستكمال والطوابير وفكّ الضغط أثناء التنزيل.'
    },
    actionLabel: { en: 'Meet Majra', ar: 'تعرّف على مجرى' },
    status: 'live',
    statusLabel: { en: 'Live', ar: 'متاح' },
    platform: { en: 'Windows 10/11', ar: 'ويندوز 10/11' },
    version: '1.2.3',
    size: '127.8 MB',
    license: 'MIT',
    href: './apps/majra/',
    icon: './assets/img/majra-icon.png',
    repo: 'https://github.com/bouadjadjatamer2-hub/asraab'
  },
  {
    slug: 'droidcrate',
    name: { en: 'DroidCrate', ar: 'DroidCrate' },
    category: { en: 'Android service bench', ar: 'ورشة صيانة أندرويد' },
    tagline: {
      en: 'Know the device. Use official tools. Follow the checklist.',
      ar: 'اعرف الجهاز. استعمل الأدوات الرسمية. اتبع قائمة التحقق.'
    },
    description: {
      en: 'A Windows workbench for phones you own: USB mode detection, official tool links, gated checklists, ADB and Fastboot helpers, lessons, and local history. Works offline.',
      ar: 'ورشة ويندوز لهواتف تملكها: كشف وضع USB، روابط أدوات رسمية، قوائم تحقق ببوابة ملكية، أدوات ADB وFastboot، دروس، وسجل محلي. يعمل دون إنترنت.'
    },
    actionLabel: { en: 'Meet DroidCrate', ar: 'تعرّف على DroidCrate' },
    status: 'live',
    statusLabel: { en: 'Live', ar: 'متاح' },
    platform: { en: 'Windows 10/11', ar: 'ويندوز 10/11' },
    version: '0.1.0',
    size: '117.6 MB',
    license: 'MIT',
    href: './apps/droidcrate/',
    icon: './assets/img/droidcrate-icon.png',
    repo: 'https://github.com/bouadjadjatamer2-hub/DroidCrate'
  }
]

window.ASRAAB_CATALOG = {
  updated: '2026-10-27'
}
