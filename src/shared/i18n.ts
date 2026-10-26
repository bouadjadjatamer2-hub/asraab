import type { Locale } from './types'

/** Every string the app can show, keyed by the English source text. Keeping the source as the
 * key means an untranslated string still reads naturally instead of exposing an identifier. */
const arabic: Record<string, string> = {
  // Window chrome and native menus
  'Open Majra': 'فتح Majra',
  'Quit Majra': 'إنهاء Majra',
  Cut: 'قص',
  Copy: 'نسخ',
  Paste: 'لصق',
  'Select All': 'تحديد الكل',
  'Choose download folder': 'اختر مجلد التنزيل',
  'Choose .torrent file': 'اختر ملف .torrent',
  Choose: 'اختر',
  'Torrent files': 'ملفات التورنت',
  About: 'حول',
  'About Majra': 'حول Majra',
  'Hide Majra': 'إخفاء Majra',
  'Hide Others': 'إخفاء الآخرين',
  'Show All': 'إظهار الكل',
  Services: 'الخدمات',
  Quit: 'إنهاء',
  File: 'ملف',
  Edit: 'تحرير',
  View: 'عرض',
  Window: 'نافذة',
  Minimize: 'تصغير',
  Zoom: 'تكبير',
  'Bring All to Front': 'إحضار الكل إلى الأمام',
  Language: 'اللغة',
  'Switch to Arabic': 'التبديل إلى العربية',
  'Switch to English': 'التبديل إلى الإنجليزية',
  'Restart to apply {language}': 'أعد التشغيل لتطبيق {language}',
  'Language saved': 'تم حفظ اللغة',
  'Restart Majra to switch to {language}?': 'أعد تشغيل Majra للتبديل إلى {language}؟',
  'The app will restart to apply the new language. Your downloads will keep their progress.':
    'ستُعاد تهيئة التطبيق لتطبيق اللغة الجديدة. ستحتفظ التنزيلات بتقدّمها.',
  'Restart now': 'إعادة التشغيل الآن',
  Later: 'لاحقًا',
  'Restarting…': 'جارٍ إعادة التشغيل…',
  'Keep {language}': 'الإبقاء على {language}',
  'Cancel language change': 'إلغاء تغيير اللغة',
  Arabic: 'العربية',
  English: 'الإنجليزية',
  'Turbo mode: more streams per network': 'الوضع السريع: مزيد من الاتصالات لكل شبكة',
  'Switch to dark theme': 'التبديل إلى المظهر الداكن',
  'Switch to light theme': 'التبديل إلى المظهر الفاتح',
  'Version {version}': 'الإصدار {version}',

  // Common controls
  OK: 'حسنًا',
  Cancel: 'إلغاء',
  Close: 'إغلاق',
  Save: 'حفظ',
  'Saving…': 'جارٍ الحفظ…',
  Clear: 'مسح',
  Done: 'تم',
  Change: 'تغيير',
  Keep: 'إبقاء',
  'Keep file': 'الاحتفاظ بالملف',
  'Continue download': 'متابعة التنزيل',
  Checking: 'جارٍ الفحص',
  'Copy link': 'نسخ الرابط',
  Copied: 'تم النسخ',
  Download: 'تنزيل',
  'Download again': 'تنزيل مرة أخرى',
  Open: 'فتح',
  Retry: 'إعادة المحاولة',
  Pause: 'إيقاف مؤقت',
  Resume: 'استئناف',
  Remove: 'إزالة',
  Delete: 'حذف',
  All: 'الكل',
  Active: 'النشطة',
  Attention: 'الانتباه',
  Finished: 'المكتملة',
  Downloads: 'التنزيلات',
  'New download': 'تنزيل جديد',
  'Select all': 'تحديد الكل',
  'Deselect all': 'إلغاء تحديد الكل',
  selected: 'محدد',
  'More actions': 'مزيد من الإجراءات',
  'Show all downloads': 'عرض كل التنزيلات',
  'No network': 'لا توجد شبكة',
  Networks: 'الشبكات',
  Network: 'الشبكة',
  Status: 'الحالة',
  Progress: 'التقدّم',
  Share: 'المساهمة',
  Speed: 'السرعة',
  Transferred: 'المنقول',
  Downloaded: 'تم تنزيله',
  Uploaded: 'تم رفعه',
  Peers: 'الأقران',
  Streams: 'الاتصالات',
  Total: 'الإجمالي',
  Size: 'الحجم',
  Time: 'الوقت',
  Peak: 'الذروة',
  Average: 'المتوسط',
  AVERAGE: 'المتوسط',
  AVG: 'المتوسط',
  PEAK: 'الذروة',
  TURBO: 'سريع',
  TORRENT: 'تورنت',
  FILE: 'ملف',
  DIR: 'مجلد',
  COMBINED: 'مجمّع',
  BACKUP: 'احتياطي',
  '24h': '٢٤ س',
  now: 'الآن',
  ago: 'مضت',
  today: 'اليوم',
  Yesterday: 'أمس',
  'Just now': 'الآن',
  'Today {time}': 'اليوم {time}',
  'Yesterday {time}': 'أمس {time}',
  '{n} min ago': 'قبل {n} دقيقة',
  '{n}s': '{n} ث',
  '{m}m {s}s': '{m} د {s} ث',
  '{h}h {m}m': '{h} س {m} د',
  '{chosen} of {files}': '{chosen} من {files}',
  'No limit': 'بلا حد',
  Limit: 'الحد',
  'Limit {value}': 'حد {value}',
  'Limited to {value}': 'محدود بـ {value}',
  of: 'من',
  and: 'و',
  'per network': 'لكل شبكة',
  Auto: 'تلقائي',
  Archive: 'أرشيف',
  Name: 'الاسم',
  Color: 'اللون',
  'Edit network': 'تعديل الشبكة',
  'Speed & data limits': 'حدود السرعة والبيانات',
  'Data limit reached': 'تم بلوغ حد البيانات',
  'No network connected': 'لا توجد شبكة متصلة',
  'Scan again': 'فحص مجددًا',
  'Network settings': 'إعدادات الشبكة',
  'Ready when you are.': 'جاهز عندما تكون مستعدًا.',
  'Add a download': 'إضافة تنزيل',
  'Nothing in the queue': 'لا شيء في قائمة الانتظار',
  'No downloads in progress': 'لا توجد تنزيلات قيد التنفيذ',
  'No finished downloads': 'لا توجد تنزيلات مكتملة',
  'No downloads need attention': 'لا توجد تنزيلات تحتاج إلى انتباه',
  'Clear finished list': 'مسح قائمة المكتملة',
  'Needs attention': 'يحتاج إلى انتباه',
  'Select all downloads needing attention': 'تحديد كل التنزيلات التي تحتاج إلى انتباه',
  'Select all {group} downloads': 'تحديد كل تنزيلات {group}',

  // Status bar
  'Limit downloads to': 'تحديد التنزيلات بـ',
  'Slow mode': 'الوضع البطيء',
  'Speed units': 'وحدات السرعة',
  bytes: 'بايت',
  bits: 'بت',
  '{size} free': '{size} متاحة',
  '{n} waiting': '{n} في الانتظار',
  'MB/s': 'MB/s',
  Mbps: 'Mbps',

  // Download list
  'All downloads': 'كل التنزيلات',
  'In progress': 'قيد التنفيذ',
  'Filter downloads': 'تصفية التنزيلات',
  Downloading: 'قيد التنزيل',
  Queued: 'في الانتظار',
  Paused: 'متوقف مؤقتًا',
  downloading: 'قيد التنزيل',
  queued: 'في الانتظار',
  paused: 'متوقف مؤقتًا',
  completed: 'مكتمل',
  failed: 'فشل',
  error: 'خطأ',
  'all done': 'اكتمل الكل',
  '{n} {label}': '{n} {label}',
  '{n} selected': 'تم تحديد {n}',
  'Select {name}': 'تحديد {name}',
  'Open {name}': 'فتح {name}',
  'Paused at {percent}% · {sizes}': 'متوقف عند {percent}% · {sizes}',
  'Paused · {sizes}': 'متوقف مؤقتًا · {sizes}',
  'Waiting for a turn': 'بانتظار الدور',
  'Waiting for a turn · {sizes}': 'بانتظار الدور · {sizes}',
  '{done} of {total}': '{done} من {total}',
  'moved or deleted': 'نُقل أو حُذف',
  'Something went wrong': 'حدث خطأ ما',
  'Select all downloads': 'تحديد كل التنزيلات',

  // New download
  'Previous download': 'التنزيل السابق',
  'Next download': 'التنزيل التالي',
  Link: 'الرابط',
  'Paste a link: https:// or magnet:': 'ألصق رابطًا: https:// أو magnet:',
  'Clear link': 'مسح الرابط',
  'Open .torrent': 'فتح ملف .torrent',
  'From {source}': 'من {source}',
  'with your {service} sign-in': 'باستخدام تسجيل الدخول إلى {service}',
  'Same file as': 'الملف نفسه كـ',
  '{name}, which failed. Resume that instead?': '{name}، الذي فشل. هل تريد استئنافه بدلًا من ذلك؟',
  'Resume it': 'استئنافه',
  'No peers found yet, still looking…': 'لم يُعثر على أقران بعد، ما زال البحث جاريًا…',
  'Checking the link…': 'جارٍ فحص الرابط…',
  'File name': 'اسم الملف',
  'size unknown': 'الحجم غير معروف',
  'unpacks while it downloads': 'يُفكّ أثناء التنزيل',
  'Uses one connection. The file size is unknown.': 'يستخدم اتصالًا واحدًا. حجم الملف غير معروف.',
  'Uses one connection. This server doesn’t support parallel downloads.':
    'يستخدم اتصالًا واحدًا. هذا الخادم لا يدعم التنزيلات المتوازية.',
  resumable: 'قابل للاستئناف',
  'Unpack while downloading': 'فك الضغط أثناء التنزيل',
  'Files go straight to {path}. The archive isn’t saved, so only the unpacked files need room. Uses one connection, so it can be slower than a parallel download; pausing starts it over.':
    'تنتقل الملفات مباشرة إلى {path}. لا يُحفظ الأرشيف، لذا تحتاج الملفات المفكوكة فقط إلى مساحة. يستخدم اتصالًا واحدًا، لذا قد يكون أبطأ من التنزيل المتوازي؛ ويبدأ من جديد عند الإيقاف المؤقت.',
  'Save to': 'حفظ في',
  'Every network has reached its data limit. Raise one in Speed & data limits.':
    'بلغت كل الشبكات حد البيانات. ارفع حد إحداها من حدود السرعة والبيانات.',
  'This download uses one connection on one network.':
    'يستخدم هذا التنزيل اتصالًا واحدًا على شبكة واحدة.',
  'share a subnet ({subnet}), so the computer sends both down one route and they can’t be combined.':
    'تشتركان في شبكة فرعية ({subnet})، لذا يرسل الكمبيوتر كليهما عبر مسار واحد ولا يمكن دمجهما.',
  Starting: 'جارٍ البدء',
  'Add to scheduled queue': 'إضافة إلى قائمة الانتظار المجدولة',
  'Add to queue': 'إضافة إلى قائمة الانتظار',

  // Download detail
  'Download complete:': 'اكتمل التنزيل:',
  'moved or deleted since': 'نُقل أو حُذف منذ ذلك الحين',
  'Speed over the download': 'السرعة خلال التنزيل',
  'Contribution by network': 'مساهمة كل شبكة',
  'written in {n} pieces': 'كُتب في {n} قطعة',
  'written in {n} chunks': 'كُتب في {n} مقطع',
  'uploaded {size}': 'تم رفع {size}',
  '{n} retries': '{n} محاولات إعادة',
  '{n} retry': 'محاولة إعادة واحدة',
  retry: 'إعادة محاولة',
  retries: 'محاولات إعادة',
  'Saving to': 'الحفظ في',
  'Saving to:': 'الحفظ في:',
  Folder: 'مجلد',
  'Percentage of the download completed with verified data from this network.':
    'النسبة المكتملة من التنزيل ببيانات موثّقة من هذه الشبكة.',
  'Last {n}s': 'آخر {n} ث',
  'TOTAL SPEED': 'السرعة الإجمالية',
  QUEUED: 'في الانتظار',
  PAUSED: 'متوقف مؤقتًا',
  THROUGHPUT: 'معدل النقل',
  'Slow drive': 'قرص بطيء',
  'Your drive can’t save any faster, so this download is going slower.':
    'لا يستطيع القرص الحفظ بسرعة أكبر، لذا هذا التنزيل أبطأ.',
  '{ratio}× {name} ALONE': '{ratio}× {name} وحده',
  'Total speed is {ratio}× faster than {name} alone':
    'السرعة الإجمالية أسرع {ratio}× من {name} وحده',
  'Total downloaded is {ratio}× compared to {name} alone':
    'إجمالي ما نُزّل هو {ratio}× مقارنةً بـ {name} وحده',
  'Can’t reach peers. Retrying…': 'تعذّر الوصول إلى الأقران. جارٍ إعادة المحاولة…',
  'Can’t reach the server. Retrying…': 'تعذّر الوصول إلى الخادم. جارٍ إعادة المحاولة…',
  'Every network in use has reached its data limit. Raise one in Speed & data limits.':
    'بلغت كل شبكة قيد الاستخدام حد البيانات. ارفع حد إحداها من حدود السرعة والبيانات.',
  'Waiting for a network. Reconnect one or switch one on.':
    'بانتظار شبكة. أعد توصيل إحداها أو شغّلها.',
  'Majra — {label} ({percent}%)': 'Majra — {label} ({percent}%)',
  'Majra — {label}': 'Majra — {label}',
  'Majra — {percent}%': 'Majra — {percent}%',
  'Majra — downloading': 'Majra — قيد التنزيل',
  Majra: 'Majra',
  'SLOW MODE {value}': 'الوضع البطيء {value}',
  'LIMIT {value}': 'الحد {value}',
  '(click to toggle)': '(انقر للتبديل)',

  // Network rows and block grid
  Off: 'متوقفة',
  'Not connected': 'غير متصلة',
  'Can’t reach server': 'تعذّر الوصول إلى الخادم',
  Failed: 'فشل',
  'Can’t reach peers': 'تعذّر الوصول إلى الأقران',
  'Retrying…': 'جارٍ إعادة المحاولة…',
  Idle: 'خاملة',
  'Stream #': 'الاتصال #',
  'Chunk #': 'المقطع #',
  'Racing another stream for this chunk, which was running slowly':
    'تتسابق مع اتصال آخر على هذا المقطع الذي كان بطيئًا',
  'Stream #{n} progress': 'تقدّم الاتصال رقم {n}',
  Receiving: 'يستقبل',
  'Peer #': 'القرين #',
  'Receiving at': 'يستقبل بسرعة',
  'Sending at': 'يرسل بسرعة',
  Received: 'المستلَم',
  Sent: 'المرسَل',
  Error: 'خطأ',
  'Use {name}': 'استخدام {name}',
  '{name} progress': 'تقدّم {name}',
  'Downloading at': 'ينزّل بسرعة',
  'Uploading at': 'يرفع بسرعة',
  On: 'مشغّلة',
  off: 'إيقاف',
  on: 'تشغيل',
  Piece: 'قطعة',
  Chunk: 'مقطع',
  pending: 'معلّق',
  skipped: 'متجاوز',
  'skipped: in no file chosen': 'متجاوز: خارج الملفات المختارة',
  'received, awaiting verification': 'مستلَم، بانتظار التحقق',
  verified: 'موثّق',
  each: 'لكل واحد',
  'Show the {units} in progress': 'إظهار {units} قيد التنفيذ',

  // Limits
  'No active downloads': 'لا توجد تنزيلات نشطة',
  '{n} downloading right now': '{n} قيد التنزيل الآن',
  'Total speed': 'السرعة الإجمالية',
  'Limits the combined download speed across all networks.':
    'يحدّ من سرعة التنزيل المجمّعة عبر كل الشبكات.',
  'Replaces the total speed limit while enabled. Useful during calls or streaming.':
    'يستبدل حد السرعة الإجمالي أثناء تفعيله. مفيد أثناء المكالمات أو البث.',
  'Slow mode speed': 'سرعة الوضع البطيء',
  Enabled: 'مفعّل',
  'Downloads at once': 'التنزيلات المتزامنة',
  'Other downloads wait in the queue and start automatically.':
    'تنتظر التنزيلات الأخرى في قائمة الانتظار وتبدأ تلقائيًا.',
  'Decrease simultaneous downloads': 'تقليل التنزيلات المتزامنة',
  'Increase simultaneous downloads': 'زيادة التنزيلات المتزامنة',
  'at the same time': 'في الوقت نفسه',
  'Power & automation': 'الطاقة والأتمتة',
  'Turbo mode': 'الوضع السريع',
  '16 to 64 streams per network, 4 MB blocks. A server that refuses extra connections still works.':
    'من 16 إلى 64 اتصالًا لكل شبكة، وكتل بحجم 4 ميغابايت. يظل الخادم الذي يرفض اتصالات إضافية صالحًا.',
  'Sort finished files': 'ترتيب الملفات المكتملة',
  'Move each download into a Video, Audio, Programs, Documents, Archives or Images folder.':
    'انقل كل تنزيل إلى مجلد الفيديو أو الصوت أو البرامج أو المستندات أو الأرشيفات أو الصور.',
  'Scan with Windows Defender': 'الفحص باستخدام Windows Defender',
  'Runs a Defender scan on each finished file and reports the result.':
    'يشغّل فحص Defender على كل ملف مكتمل ويبلّغ بالنتيجة.',
  'Watch the clipboard': 'مراقبة الحافظة',
  'A file link you copy opens in New download, ready to start. Nothing starts on its own.':
    'يُفتح رابط الملف الذي تنسخه في تنزيل جديد، جاهزًا للبدء. لا يبدأ أي شيء من تلقاء نفسه.',
  'Shut down when finished': 'إيقاف التشغيل عند الانتهاء',
  'Once the queue is empty, Windows shuts down after 60 seconds. Cancel with: shutdown /a':
    'بعد فراغ قائمة الانتظار، يُوقف Windows التشغيل بعد 60 ثانية. للإلغاء: shutdown /a',
  'Startup & background': 'بدء التشغيل والخلفية',
  'Keep Majra ready for links and downloads without leaving a window open.':
    'أبقِ Majra جاهزًا للروابط والتنزيلات دون إبقاء نافذة مفتوحة.',
  'Start at login': 'بدء التشغيل عند تسجيل الدخول',
  'Open Majra automatically when you sign in. On Windows it starts hidden in the tray and appears in Task Manager → Startup.':
    'افتح Majra تلقائيًا عند تسجيل الدخول. على Windows يبدأ مخفيًا في شريط النظام ويظهر في إدارة المهام ← بدء التشغيل.',
  'Keep running in the background': 'الاستمرار في الخلفية',
  'Closing the window leaves downloads and the browser extension running. Use Quit in the tray menu to exit fully.':
    'إغلاق النافذة يُبقي التنزيلات وإضافة المتصفح قيد التشغيل. استخدم «إنهاء» في قائمة شريط النظام للخروج كليًا.',
  'Reset to defaults': 'إعادة الضبط إلى الافتراضي',
  'Reset all downloads to defaults?': 'إعادة ضبط كل إعدادات التنزيل إلى الافتراضي؟',
  'This resets total speed, slow mode, downloads at once, the download schedule, the power options and startup behaviour. Network limits stay unchanged.':
    'يعيد هذا ضبط السرعة الإجمالية والوضع البطيء والتنزيلات المتزامنة وجدولة التنزيل وخيارات الطاقة وسلوك بدء التشغيل. تبقى حدود الشبكات دون تغيير.',
  Settings: 'الإعدادات',
  General: 'عام',
  'used by Majra': 'استخدمها Majra',
  'Limits the combined download speed on {name}.': 'يحدّ من سرعة التنزيل المجمّعة على {name}.',
  '{name} speed': 'سرعة {name}',
  'Data limit': 'حد البيانات',
  'Stops downloads on {name} at the limit. Uploads and other apps don’t count.':
    'يوقف التنزيلات على {name} عند بلوغ الحد. لا تُحتسب عمليات الرفع والتطبيقات الأخرى.',
  '{name} data limit': 'حد بيانات {name}',
  per: 'لكل',
  '{name} data limit period': 'فترة حد بيانات {name}',
  'Reset data usage': 'إعادة ضبط استهلاك البيانات',
  'Remove limits': 'إزالة الحدود',
  'Reset data usage for {name}?': 'إعادة ضبط استهلاك البيانات لـ {name}؟',
  'Remove limits for {name}?': 'إزالة حدود {name}؟',
  'This resets {name}’s usage {period} to zero. Its configured limits and usage for other periods stay unchanged. Downloads can use this network again if its data limit was reached.':
    'يعيد هذا ضبط استهلاك {name} {period} إلى الصفر. تبقى حدوده واستهلاكه لفترات أخرى دون تغيير. يمكن للتنزيلات استخدام هذه الشبكة مجددًا إذا كان قد بلغ حد بياناتها.',
  'This removes {name}’s speed and data limits. Its recorded data usage stays unchanged. The total speed limit and slow mode still apply.':
    'يزيل هذا حدود السرعة والبيانات لـ {name}. يبقى استهلاك البيانات المسجّل دون تغيير. ولا يزال حد السرعة الإجمالي والوضع البطيء مطبّقين.',
  'Check schedule times, repeat days and end date.':
    'تحقق من أوقات الجدولة وأيام التكرار وتاريخ الانتهاء.',
  Day: 'يوم',
  Week: 'أسبوع',
  Month: 'شهر',
  'this week': 'هذا الأسبوع',
  'this month': 'هذا الشهر',
  Resets: 'تُعاد الضبط',
  'tomorrow at midnight': 'غدًا عند منتصف الليل',
  'on {date}': 'في {date}',
  'Weeks start Monday.': 'تبدأ الأسابيع يوم الاثنين.',
  'Raise the limit or reset data usage to keep using this network sooner.':
    'ارفع الحد أو أعد ضبط استهلاك البيانات لمواصلة استخدام هذه الشبكة عاجلًا.',
  'Limit to': 'التحديد بـ',
  'Speed on {name}': 'السرعة على {name}',

  // Schedule
  'Download schedule': 'جدولة التنزيل',
  'Schedule times and days': 'أوقات الجدولة وأيامها',
  'Start at': 'البدء عند',
  'Stop at': 'التوقف عند',
  'Next day': 'اليوم التالي',
  'Repeat on': 'التكرار في',
  'Schedule days': 'أيام الجدولة',
  'End date': 'تاريخ الانتهاء',
  Optional: 'اختياري',
  'No end date': 'بلا تاريخ انتهاء',
  'Choose end date': 'اختر تاريخ الانتهاء',
  Sun: 'الأحد',
  Mon: 'الاثنين',
  Tue: 'الثلاثاء',
  Wed: 'الأربعاء',
  Thu: 'الخميس',
  Fri: 'الجمعة',
  Sat: 'السبت',
  'Downloads stop at {time}': 'تتوقف التنزيلات عند {time}',
  'Waiting until {time} {day}': 'بانتظار حتى {time} {day}',
  'Schedule ended · downloads waiting': 'انتهت الجدولة · التنزيلات في الانتظار',
  'Schedule needs attention': 'الجدولة تحتاج إلى انتباه',
  'Download schedule enabled': 'جدولة التنزيل مفعّلة',

  // Removal and actions
  'Cancel download?': 'إلغاء التنزيل؟',
  'Cancel {n} downloads?': 'إلغاء {n} تنزيلات؟',
  'The part already downloaded will be deleted.': 'سيُحذف الجزء الذي نُزّل بالفعل.',
  'Cancel download': 'إلغاء التنزيل',
  'Cancel downloads': 'إلغاء التنزيلات',
  'Delete file?': 'حذف الملف؟',
  'Delete {n} files?': 'حذف {n} ملفات؟',
  'The file will be moved to the {trash}.': 'سيُنقل الملف إلى {trash}.',
  'The files will be moved to the {trash}.': 'ستُنقل الملفات إلى {trash}.',
  'Delete file': 'حذف الملف',
  'Delete files': 'حذف الملفات',
  'Clear finished list?': 'مسح قائمة المكتملة؟',
  'Remove from list?': 'إزالة من القائمة؟',
  'Remove {n} downloads from list?': 'إزالة {n} تنزيلات من القائمة؟',
  'The downloaded file stays on your computer.': 'يبقى الملف المنزّل على جهاز الكمبيوتر.',
  'The downloaded files stay on your computer.': 'تبقى الملفات المنزّلة على جهاز الكمبيوتر.',
  'Finished files stay on your computer. Failed downloads lose the part they already downloaded.':
    'تبقى الملفات المكتملة على جهاز الكمبيوتر. تفقد التنزيلات الفاشلة الجزء الذي نُزّل بالفعل.',
  'Clear list': 'مسح القائمة',
  Pausing: 'جارٍ الإيقاف المؤقت',
  'Couldn’t pause': 'تعذّر الإيقاف المؤقت',
  Resuming: 'جارٍ الاستئناف',
  'Couldn’t resume': 'تعذّر الاستئناف',
  Retrying: 'جارٍ إعادة المحاولة',
  'Couldn’t retry': 'تعذّرت إعادة المحاولة',
  'Fix link': 'إصلاح الرابط',
  'Couldn’t start again': 'تعذّر البدء مجددًا',
  'Couldn’t open file': 'تعذّر فتح الملف',
  'Show in Finder': 'إظهار في Finder',
  'Show in folder': 'إظهار في المجلد',
  'Couldn’t show file': 'تعذّر إظهار الملف',
  'Couldn’t copy link': 'تعذّر نسخ الرابط',
  'Remove from list': 'إزالة من القائمة',
  'Move file to {trash}': 'نقل الملف إلى {trash}',
  'Move {n} files to {trash}': 'نقل {n} ملفات إلى {trash}',
  'Move to {trash}': 'نقل إلى {trash}',
  'Copy magnet link': 'نسخ رابط magnet',
  'Copy {n} magnet links': 'نسخ {n} روابط magnet',
  'That file is no longer where it was saved.': 'لم يعد هذا الملف في المكان الذي حُفظ فيه.',
  '{left} of {total} couldn’t be removed: {error}': 'تعذّرت إزالة {left} من {total}: {error}',

  // Fix link, errors and network binding
  'Paste a new link': 'ألصق رابطًا جديدًا',
  'Paste a new link to the same file: {name} ({size}). Majra resumes from where the download stopped.':
    'ألصق رابطًا جديدًا للملف نفسه: {name} ({size}). يستأنف Majra من حيث توقف التنزيل.',
  'Paste a new link to the same file: {name}. Majra resumes from where the download stopped.':
    'ألصق رابطًا جديدًا للملف نفسه: {name}. يستأنف Majra من حيث توقف التنزيل.',
  ' Or download it again in {browser} and choose Resume it.':
    ' أو نزّله مرة أخرى في {browser} واختر «استئنافه».',
  'New link': 'رابط جديد',
  'https://…': 'https://…',
  'Download cancelled': 'أُلغي التنزيل',
  'Download failed': 'فشل التنزيل',
  'The download was stopped before finishing.': 'أُوقف التنزيل قبل اكتماله.',
  'The download stopped unexpectedly. Try again.': 'توقف التنزيل بشكل غير متوقع. حاول مجددًا.',
  downloaded: 'منزّل',
  'No data downloaded': 'لم تُنزّل أي بيانات',
  'Only your default network can be used': 'لا يمكن استخدام سوى شبكتك الافتراضية',
  'This system doesn’t let apps send a connection through a specific network, which needs Linux kernel 5.7 or newer. Every connection will go through your default network, so the others will show no ping and won’t add speed. Updating your system fixes this.':
    'لا يسمح هذا النظام للتطبيقات بإرسال اتصال عبر شبكة محددة، وهذا يتطلب Linux kernel 5.7 أو أحدث. سيمر كل اتصال عبر شبكتك الافتراضية، لذا لن تُظهر الشبكات الأخرى أي استجابة ولن تضيف سرعة. تحديث نظامك يحل هذه المشكلة.',
  'Got it': 'فهمت',

  // Updates
  'Checking for updates…': 'جارٍ البحث عن تحديثات…',
  'Majra {version} is available': 'يتوفر Majra {version}',
  'Downloading Majra {version}… {percent}%': 'جارٍ تنزيل Majra {version}… {percent}%',
  'Majra {version} is ready — restart to update': 'Majra {version} جاهز — أعد التشغيل للتحديث',
  'Couldn’t install Majra {version}': 'تعذّر تثبيت Majra {version}',
  'Majra updates automatically': 'يتحدّث Majra تلقائيًا',
  'Automatic updates are off': 'التحديثات التلقائية متوقفة',
  'Restart to update': 'أعد التشغيل للتحديث',
  'Restart to Update to {version}': 'أعد التشغيل للتحديث إلى {version}',
  'Downloading {version}…': 'جارٍ تنزيل {version}…',
  'Get Majra {version} from the Website…': 'احصل على Majra {version} من الموقع…',
  'Checking for Updates…': 'جارٍ البحث عن تحديثات…',
  Update: 'تحديث',
  'Check for Updates…': 'البحث عن تحديثات…',
  'Update Automatically': 'التحديث تلقائيًا',
  'You’re up to date': 'أنت تستخدم أحدث إصدار',
  'Majra {version} is the newest version.': 'Majra {version} هو أحدث إصدار.',
  'Couldn’t check for updates': 'تعذّر البحث عن تحديثات',
  'Check your connection and try again.': 'تحقق من اتصالك وحاول مجددًا.',
  'Download Majra {version}': 'تنزيل Majra {version}',
  'Get the update from the website': 'احصل على التحديث من الموقع',
  'Update downloaded. Restart Majra to install it.': 'نُزّل التحديث. أعد تشغيل Majra لتثبيته.',
  'A new version of Majra is ready. Restart to update.':
    'يتوفر إصدار جديد من Majra. أعد التشغيل للتحديث.',

  // Notifications and main-process messages
  'Download complete': 'اكتمل التنزيل',
  '{name} has finished downloading.': 'اكتمل تنزيل {name}.',
  '{name} couldn’t be downloaded.': 'تعذّر تنزيل {name}.',
  'Scan complete': 'اكتمل الفحص',
  '{name}: no threats found.': '{name}: لم يُعثر على تهديدات.',
  '{name} is safe.': '{name} آمن.',
  'Threat found': 'تم العثور على تهديد',
  '{name}: Windows Defender found a threat.': '{name}: عثر Windows Defender على تهديد.',
  'Windows Defender found a threat in {name}.': 'عثر Windows Defender على تهديد في {name}.',
  'Extraction complete': 'اكتمل فك الضغط',
  '{name} is ready.': '{name} جاهز.',
  '{name} was unpacked.': 'تم فك ضغط {name}.',
  'Shutting down': 'جارٍ إيقاف التشغيل',
  'Every download finished. Windows will shut down in 60 seconds.':
    'اكتملت كل التنزيلات. سيوقف Windows التشغيل بعد 60 ثانية.',
  'Majra: every download finished.': 'Majra: اكتملت كل التنزيلات.',
  'That archive can’t be unpacked while downloading.': 'لا يمكن فك ضغط هذا الأرشيف أثناء التنزيل.',
  'This is one part of a multipart archive. It can’t be unpacked while downloading; save every part, then unpack them together.':
    'هذا جزء من أرشيف متعدد الأجزاء. لا يمكن فك ضغطه أثناء التنزيل؛ احفظ كل الأجزاء ثم فك ضغطها معًا.',
  'This is one part of a split ZIP. It can’t be unpacked while downloading; save every part, then unpack them together.':
    'هذا جزء من ملف ZIP مقسّم. لا يمكن فك ضغطه أثناء التنزيل؛ احفظ كل الأجزاء ثم فك ضغطها معًا.',
  'A .7z archive keeps its index at the end, so it can’t be unpacked until it has fully downloaded. Save it and unpack it when it’s done.':
    'يحتفظ أرشيف ‎.7z بفهرسه في النهاية، لذا لا يمكن فك ضغطه حتى يكتمل تنزيله. احفظه ثم فك ضغطه بعد اكتماله.',
  'This server didn’t report the archive’s size, so it can’t be unpacked while downloading.':
    'لم يبلّغ هذا الخادم بحجم الأرشيف، لذا لا يمكن فك ضغطه أثناء التنزيل.',
  'This server doesn’t support resuming, so the archive can’t be unpacked while downloading.':
    'هذا الخادم لا يدعم الاستئناف، لذا لا يمكن فك ضغط الأرشيف أثناء التنزيل.',
  'Majra is still running': 'لا يزال Majra قيد التشغيل',
  'Majra keeps running in the background. Choose Quit in the tray menu to exit.':
    'يستمر Majra في العمل بالخلفية. اختر «إنهاء» من قائمة شريط النظام للخروج.',
  'Majra — download with every connection you have.\nEvery link, one stream.':
    'Majra — نزّل بكل اتصال متاح لديك.\nكل رابط، مجرى واحد.',
  'That download is no longer waiting.': 'هذا التنزيل لم يعد في الانتظار.',

  // Shared error hints
  'There isn’t enough space to save this download. Free up space or choose another folder.':
    'لا توجد مساحة كافية لحفظ هذا التنزيل. أفرغ مساحة أو اختر مجلدًا آخر.',
  'Majra doesn’t have permission to access this file or folder. Check its permissions or choose another folder.':
    'لا يملك Majra إذنًا للوصول إلى هذا الملف أو المجلد. تحقق من الأذونات أو اختر مجلدًا آخر.',
  'The file or folder is missing. Check the download location and try again.':
    'الملف أو المجلد مفقود. تحقق من موقع التنزيل وحاول مجددًا.',
  'This drive is read-only. Choose another download folder.':
    'هذا القرص للقراءة فقط. اختر مجلد تنزيل آخر.',
  'Majra couldn’t read or write the download. Check the drive and try again.':
    'تعذّر على Majra قراءة التنزيل أو كتابته. تحقق من القرص وحاول مجددًا.',
  'Majra couldn’t read this torrent. Try another magnet link or .torrent file.':
    'تعذّر على Majra قراءة هذا التورنت. جرّب رابط magnet أو ملف .torrent آخر.',
  'This link no longer works. Paste a new link to continue.':
    'هذا الرابط لم يعد يعمل. ألصق رابطًا جديدًا للمتابعة.',
  'Majra couldn’t download every part of the file. Try downloading again.':
    'تعذّر على Majra تنزيل كل أجزاء الملف. حاول التنزيل مجددًا.',
  'The downloaded file has an unexpected size. Majra couldn’t save the completed file. Try downloading again.':
    'حجم الملف المنزّل غير متوقع. تعذّر على Majra حفظ الملف المكتمل. حاول التنزيل مجددًا.',
  'Majra couldn’t find the server. Check the link and your connection.':
    'تعذّر على Majra العثور على الخادم. تحقق من الرابط واتصالك.',
  'The server refused the connection. Try again later.': 'رفض الخادم الاتصال. حاول مجددًا لاحقًا.',
  'The connection was interrupted. Try again in a moment.': 'انقطع الاتصال. حاول مجددًا بعد لحظات.',
  'The connection timed out. Check your network and try again.':
    'انتهت مهلة الاتصال. تحقق من شبكتك وحاول مجددًا.',
  'The server’s security certificate couldn’t be verified. Check the link or try again later.':
    'تعذّر التحقق من شهادة أمان الخادم. تحقق من الرابط أو حاول لاحقًا.',
  'That doesn’t look like a valid link.': 'لا يبدو هذا رابطًا صالحًا.',
  'This link requires authentication. Try a direct download link.':
    'يتطلب هذا الرابط مصادقة. جرّب رابط تنزيل مباشرًا.',
  'The server refused the request (403). If the file needs a signed-in session, send the link from the browser extension.':
    'رفض الخادم الطلب (403). إذا كان الملف يتطلب جلسة مسجّلة، أرسل الرابط من إضافة المتصفح.',
  'The file couldn’t be found. Check the link and try again.':
    'تعذّر العثور على الملف. تحقق من الرابط وحاول مجددًا.',
  'The server rejected the download. Check the link and try again.':
    'رفض الخادم التنزيل. تحقق من الرابط وحاول مجددًا.',
  'The server is having trouble. Try again later.': 'يواجه الخادم مشكلة. حاول مجددًا لاحقًا.',

  // Schedule validation and shared save errors
  'Choose different start and stop times and at least one day.':
    'اختر وقت بدء وتوقف مختلفين ويومًا واحدًا على الأقل.',
  'Choose different start and stop times.': 'اختر وقت بدء وتوقف مختلفين.',

  // Misc UI
  'Download schedule requires at least one day.': 'تتطلب جدولة التنزيل يومًا واحدًا على الأقل.',
  'Open .torrent file': 'فتح ملف .torrent',
  'Drop a .torrent anywhere in this window.': 'أفلت ملف .torrent في أي مكان من هذه النافذة.',
  'Paste a link ({shortcut}) or drop a .torrent anywhere in this window. Majra spreads it across every network you have.':
    'ألصق رابطًا ({shortcut}) أو أفلت ملف .torrent في أي مكان من هذه النافذة. يوزّعه Majra على كل شبكاتك.',

  // Completion, charts and the last surfaces brought into the catalog
  'Download complete: {name}': 'اكتمل التنزيل: {name}',
  'written in {units}': 'كُتب في {units}',
  'Combined throughput over the last minute. Currently {current}, fastest {fastest}.':
    'معدل النقل المجمّع خلال الدقيقة الأخيرة. حاليًا {current}، والأسرع {fastest}.',
  '{seconds}s ago': 'قبل {seconds} ث',
  '{seconds}s before the {end}': 'قبل {end} بـ {seconds} ث',
  Now: 'الآن',
  'At pause': 'عند الإيقاف',
  'At completion': 'عند الاكتمال',
  pause: 'الإيقاف',
  end: 'النهاية',
  'LAST {n}S': 'آخر {n} ث',
  ' · {size} received, awaiting verification': ' · استُلم {size}، بانتظار التحقق',
  '{unit} #{number} · {verified} verified{provisional} / {total} · {where}':
    '{unit} #{number} · {verified} موثّق{provisional} / {total} · {where}',
  '{units} · {size} each': '{units} · {size} لكل واحد',
  'Show the pieces in progress': 'إظهار القطع قيد التنفيذ',
  'Show the chunks in progress': 'إظهار المقاطع قيد التنفيذ',
  'Chunk #{n}': 'المقطع #{n}',
  'Stream #{n}': 'الاتصال #{n}',
  'Peer #{n}': 'القرين #{n}',
  '{name} {state}': '{name} {state}',

  // New download corroboration and limits wording
  ', which failed. Resume that instead?': '، الذي فشل. هل تريد استئنافه بدلًا من ذلك؟',
  '{current} of {total}': '{current} من {total}',
  '{name} has reached its data limit. Choose another network for this download.':
    'بلغت {name} حد بياناتها. اختر شبكة أخرى لهذا التنزيل.',
  '{names} have reached their data limits. Choose another network for this download.':
    'بلغت {names} حدود بياناتها. اختر شبكة أخرى لهذا التنزيل.',
  '{names} share a subnet ({subnet}), so the computer sends both down one route and they can’t be combined.':
    'تشترك {names} في شبكة فرعية ({subnet})، لذا يرسل الكمبيوتر كليهما عبر مسار واحد ولا يمكن دمجهما.',
  '{label}, in {unit}': '{label}، بوحدة {unit}',
  '{size} used by Majra {period}': '{size} استخدمها Majra {period}',
  '{used} of {limit} {period}': '{used} من {limit} {period}',
  'Limit downloads to {value}': 'تحديد التنزيلات بـ {value}',
  '{downloads} waiting': '{downloads} في الانتظار',
  'Slow mode on': 'الوضع البطيء مفعّل',

  // Selection, removal and completion summaries
  'Selected downloads': 'التنزيلات المحددة',
  '{action} {name}': '{action} {name}',
  'Cancel {downloads}': 'إلغاء {downloads}',
  'Cancel {downloads}?': 'إلغاء {downloads}؟',
  'Pause {downloads}': 'إيقاف {downloads} مؤقتًا',
  'Resume {downloads}': 'استئناف {downloads}',
  'Retry {downloads}': 'إعادة محاولة {downloads}',
  'Copy {links}': 'نسخ {links}',
  'Remove {downloads} from list': 'إزالة {downloads} من القائمة',
  'Remove {downloads} from list?': 'إزالة {downloads} من القائمة؟',
  'Delete {files}?': 'حذف {files}؟',
  'Move {files} to {trash}': 'نقل {files} إلى {trash}',
  '{time} left': 'متبقٍ {time}',

  // Torrent files and schedule controls
  Files: 'الملفات',
  Skipped: 'متجاوز',
  'Keep at least one file.': 'أبقِ ملفًا واحدًا على الأقل.',
  'Enable download schedule': 'تفعيل جدولة التنزيل',
  'Edit {name}': 'تعديل {name}',
  '{name} limits': 'حدود {name}',
  'Start at hour': 'ساعة البدء',
  'Start at minute': 'دقيقة البدء',
  'Stop at hour': 'ساعة التوقف',
  'Stop at minute': 'دقيقة التوقف',
  'Recycle Bin': 'سلة المحذوفات',
  Trash: 'المهملات',
  Teal: 'فيروزي',
  Amber: 'كهرماني',
  Steel: 'فولاذي',
  Rose: 'وردي',
  Violet: 'بنفسجي',
  Lime: 'ليموني',
  Cyan: 'سماوي',
  Coral: 'مرجاني',

  // Empty state and performance hint
  'Majra needs at least one active network. Join a Wi-Fi network, plug in Ethernet, or connect your phone using USB tethering.':
    'يحتاج Majra إلى شبكة نشطة واحدة على الأقل. اتصل بشبكة Wi-Fi، أو وصّل كبل Ethernet، أو وصّل هاتفك عبر مشاركة USB.',
  'Turbo trades politeness for speed: more streams from the first byte, and smaller blocks so every connection stays busy.':
    'يستبدل الوضع السريع التأنّي بالسرعة: اتصالات أكثر من البايت الأول، وكتل أصغر ليبقى كل اتصال مشغولًا.'
}

/** Arabic noun forms used by countText. `{n}` is replaced with the number. */
const arabicCounts: Record<string, string> = {
  'download#one': 'تنزيل واحد',
  'download#two': 'تنزيلان',
  'download#few': '{n} تنزيلات',
  'download#many': '{n} تنزيلًا',
  'download#other': '{n} تنزيل',
  'file#one': 'ملف واحد',
  'file#two': 'ملفان',
  'file#few': '{n} ملفات',
  'file#many': '{n} ملفًا',
  'file#other': '{n} ملف',
  'network#one': 'شبكة واحدة',
  'network#two': 'شبكتان',
  'network#few': '{n} شبكات',
  'network#many': '{n} شبكة',
  'network#other': '{n} شبكة',
  'peer#one': 'قرين واحد',
  'peer#two': 'قرينان',
  'peer#few': '{n} أقران',
  'peer#many': '{n} قرينًا',
  'peer#other': '{n} قرين',
  'stream#one': 'اتصال واحد',
  'stream#two': 'اتصالان',
  'stream#few': '{n} اتصالات',
  'stream#many': '{n} اتصالًا',
  'stream#other': '{n} اتصال',
  'piece#one': 'قطعة واحدة',
  'piece#two': 'قطعتان',
  'piece#few': '{n} قطع',
  'piece#many': '{n} قطعة',
  'piece#other': '{n} قطعة',
  'chunk#one': 'مقطع واحد',
  'chunk#two': 'مقطعان',
  'chunk#few': '{n} مقاطع',
  'chunk#many': '{n} مقطعًا',
  'chunk#other': '{n} مقطع',
  'retry#one': 'محاولة إعادة واحدة',
  'retry#two': 'محاولتا إعادة',
  'retry#few': '{n} محاولات إعادة',
  'retry#many': '{n} محاولة إعادة',
  'retry#other': '{n} محاولة إعادة',
  'link#one': 'رابط واحد',
  'link#two': 'رابطان',
  'link#few': '{n} روابط',
  'link#many': '{n} رابطًا',
  'link#other': '{n} رابط',
  'minute#one': 'دقيقة واحدة',
  'minute#two': 'دقيقتان',
  'minute#few': '{n} دقائق',
  'minute#many': '{n} دقيقة',
  'minute#other': '{n} دقيقة',
  'downloading#one': 'تنزيل واحد قيد التنزيل',
  'downloading#two': 'تنزيلان قيد التنزيل',
  'downloading#few': '{n} تنزيلات قيد التنزيل',
  'downloading#many': '{n} تنزيلًا قيد التنزيل',
  'downloading#other': '{n} تنزيل قيد التنزيل',
  'queued#one': 'تنزيل واحد في الانتظار',
  'queued#two': 'تنزيلان في الانتظار',
  'queued#few': '{n} تنزيلات في الانتظار',
  'queued#many': '{n} تنزيلًا في الانتظار',
  'queued#other': '{n} تنزيل في الانتظار',
  'paused#one': 'تنزيل واحد متوقف مؤقتًا',
  'paused#two': 'تنزيلان متوقفان مؤقتًا',
  'paused#few': '{n} تنزيلات متوقفة مؤقتًا',
  'paused#many': '{n} تنزيلًا متوقفًا مؤقتًا',
  'paused#other': '{n} تنزيل متوقف مؤقتًا',
  'need attention#one': 'تنزيل واحد يحتاج إلى انتباه',
  'need attention#two': 'تنزيلان يحتاجان إلى انتباه',
  'need attention#few': '{n} تنزيلات تحتاج إلى انتباه',
  'need attention#many': '{n} تنزيلًا يحتاج إلى انتباه',
  'need attention#other': '{n} تنزيل يحتاج إلى انتباه',
  'selected#one': 'واحد محدد',
  'selected#two': 'اثنان محددان',
  'selected#few': '{n} محددة',
  'selected#many': '{n} محددًا',
  'selected#other': '{n} محدد'
}

export type MessageVars = Record<string, string | number | undefined>

export function interpolate(template: string, vars: MessageVars = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key]
    return value === undefined ? match : String(value)
  })
}

/** Translate an English source string. English is the identity; Arabic comes from the catalog.
 * A string with no translation falls back to its English source rather than an empty label. */
export function translate(locale: Locale, source: string, vars: MessageVars = {}): string {
  const template = locale === 'ar' ? (arabic[source] ?? source) : source
  return interpolate(template, vars)
}

function arabicPluralForm(count: number): 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' {
  const n = Math.abs(Math.trunc(count))
  if (n === 0) return 'zero'
  if (n === 1) return 'one'
  if (n === 2) return 'two'
  const mod100 = n % 100
  if (mod100 >= 3 && mod100 <= 10) return 'few'
  if (mod100 >= 11 && mod100 <= 99) return 'many'
  return 'other'
}

/** Counted nouns with Arabic's full plural rules. `one` is the English singular source (also the
 * Arabic catalog prefix); `other` is the English plural source. */
export function countText(
  locale: Locale,
  count: number,
  one: string,
  other: string = one,
  vars: MessageVars = {}
): string {
  const withCount = { ...vars, n: count }
  if (locale === 'en') return interpolate(count === 1 ? one : other, withCount)
  const form = arabicPluralForm(count)
  const base = one.replace(/^\{n\}\s+/, '').replace(/\s+\{n\}$/, '')
  const template =
    arabicCounts[`${base}#${form}`] ??
    arabicCounts[`${base}#other`] ??
    arabic[one] ??
    (count === 1 ? one : other)
  return interpolate(template, withCount)
}

/** The BCP 47 tag used for Intl formatting. Latin digits keep sizes, speeds and dates visually
 * consistent inside the otherwise Arabic interface. */
export function localeTag(locale: Locale): string {
  return locale === 'ar' ? 'ar-u-nu-latn' : 'en'
}

export function isRtl(locale: Locale): boolean {
  return locale === 'ar'
}

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ar'
}

export const LOCALE_NAME: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية'
}
