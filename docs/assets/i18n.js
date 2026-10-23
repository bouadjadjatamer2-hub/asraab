/* Arabic copy for the Tayyar website.
 *
 * English lives in index.html so the page is complete without JavaScript. When the visitor
 * chooses Arabic we swap the copy here and mirror the layout to RTL. Adding a key to `ar` and
 * marking the matching element with data-i18n="key" is all a new string needs.
 */
window.TAYYAR_I18N = {
  ar: {
    'meta.title': 'تيار — كل اتصالاتك. تحميل واحد.',
    'meta.description':
      'تيار مدير تحميل مجاني ومفتوح المصدر لويندوز. يقسّم الملفات بين Wi-Fi والإيثرنت وUSB، ويدعم حتى 64 اتصالاً، وفكّ الضغط أثناء التنزيل، وإضافة للمتصفح.',

    'a11y.skip': 'تجاوز إلى المحتوى',
    'a11y.home': 'الصفحة الرئيسية لتيار',
    'nav.features': 'المزايا',
    'nav.how': 'كيف يعمل',
    'nav.connections': 'الاتصالات',
    'nav.download': 'التحميل',
    'nav.extension': 'الإضافة',
    'nav.faq': 'الأسئلة',
    'nav.primary': 'التنقل الرئيسي',
    'nav.mobilePrimary': 'التنقل في القائمة',
    'nav.github': 'تيار على GitHub',
    'nav.downloadShort': 'حمّل تيار',
    'nav.menu': 'فتح القائمة',
    'nav.closeMenu': 'إغلاق القائمة',
    'theme.toLight': 'التبديل إلى الوضع الفاتح',
    'theme.toDark': 'التبديل إلى الوضع الداكن',
    'lang.switchToArabic': 'التبديل إلى العربية',
    'lang.switchToEnglish': 'التبديل إلى الإنجليزية',
    'lang.arabic': 'العربية',
    'lang.english': 'English',

    'hero.eyebrow': 'مدير تحميل لنظام ويندوز',
    'hero.title1': 'تحميل واحد.',
    'hero.title2': 'كل اتصالاتك.',
    'hero.lede':
      'يقسّم تيار الملف إلى كتل ويسحبها عبر Wi-Fi والإيثرنت وUSB في الوقت نفسه — مع استكمال التحميل بعد إعادة التشغيل، والطوابير، وفكّ الضغط أثناء التنزيل.',
    'hero.download': 'حمّل لويندوز',
    'hero.secondary': 'شاهد كيف يعمل',
    'hero.windows': 'ويندوز 10 و11',
    'hero.note': 'مجاني ومفتوح المصدر (MIT) · بدون حساب',
    'hero.chipNetworks': 'ثلاث شبكات معاً',
    'hero.chipExtract': 'فكّ ضغط أثناء التحميل',
    'hero.statsAria': 'تيار في لمحة',
    'hero.stats.streamsLabel': 'اتصالاً لكل شبكة',
    'hero.stats.networksLabel': 'أنواع الشبكات',
    'hero.stats.extractLabel': 'فكّ ضغط أثناء التنزيل',
    'hero.stats.accountsLabel': 'حسابات مطلوبة',
    'hero.scroll': 'اسحب للأسفل',

    'features.eyebrow': 'مصمّم للملفات الكبيرة',
    'features.title': 'سرعة عندما تكون هناك سعة.',
    'features.lede':
      'تيار يقوم بالعمل غير اللامع: يقسّم الملفات، يُبقي كل اتصال مشغولاً، يتحقق مما وصل، ويتركك تغلق النافذة.',
    'features.f1Tag': 'MULTI-NET',
    'features.f1Title': 'كل الاتصالات معاً',
    'features.f1Body':
      'يمكن لـ Wi-Fi والإيثرنت وUSB ومشاركة الهاتف أن تحمل الملف نفسه في الوقت ذاته. يربط تيار كل مسار بالشبكة التي اخترتها.',
    'features.f2Tag': 'STREAMS',
    'features.f2Title': 'من 2 إلى 64 اتصالاً',
    'features.f2Body':
      'اختر عدداً من الاتصالات المتوازية: 2 أو 4 أو 8 أو 16 أو 32. ويمكن لوضع Turbo أن يصل إلى 64 لكل شبكة عندما يسمح الخادم بذلك.',
    'features.f3Tag': 'EXTRACT',
    'features.f3Title': 'تحميل + فكّ ضغط',
    'features.f3Body':
      'أرشيفات ZIP وRAR وTAR — بما فيها ‎.tar.gz‎ و‎.tar.bz2‎ و‎.tar.xz‎ — تُفكّ أثناء التنزيل. بلا انتظار إضافي.',
    'features.f4Tag': 'DIRECT',
    'features.f4Title': 'روابط مباشرة، بلا لفّ',
    'features.f4Body':
      'الصق رابط الملف وانطلق. لا صفحة وسيطة ولا حساب إجباري. التحميلات المحمية بتسجيل الدخول تعمل عبر الإضافة.',
    'features.f5Tag': 'BROWSER',
    'features.f5Title': 'من المتصفح إلى تيار',
    'features.f5Body':
      'إضافة Chromium تُسلّم التحميلات إلى التطبيق مع ملفات تعريف الارتباط الخاصة بالمتصفح، ثم تنسحب من الطريق.',
    'features.f6Tag': 'TRAY',
    'features.f6Title': 'يبقى في شريط النظام',
    'features.f6Body':
      'أغلق النافذة ويستمر التحميل. ابدأ تيار مع ويندوز ليكون جاهزاً في الخلفية عند الحاجة.',
    'features.also': 'وأيضاً بالداخل',
    'features.alsoBody':
      'استكمال بعد إعادة التشغيل · طوابير وحدود · جدولة · تصنيفات · ملفات torrent · فحص اختياري بـ Windows Defender',

    'how.eyebrow': 'ثلاث خطوات',
    'how.title': 'من الرابط إلى ملف مكتمل.',
    'how.lede': 'بلا متاهة إعداد. ثبّت، الصق، واتركه يعمل.',
    'how.step1Tag': '01 / تثبيت',
    'how.step1Title': 'ثبّت تيار',
    'how.step1Body':
      'حمّل مثبّت ويندوز وشغّله. الملف غير موقّع رقمياً، لذا قد يطلب SmartScreen تأكيداً — نشرح ذلك بالأسفل.',
    'how.step2Tag': '02 / إضافة',
    'how.step2Title': 'أضف ما تريد',
    'how.step2Body':
      'الصق رابطاً مباشراً، أو افتح ملف ‎.torrent‎، أو أرسل التحميل من إضافة المتصفح.',
    'how.step3Tag': '03 / تشغيل',
    'how.step3Title': 'اترك تيار يعمل',
    'how.step3Body':
      'تتوزع الكتل على شبكاتك، ويُتحقق منها أثناء وصولها، وتُفكّ الأرشيفات المدعومة دون انتظار.',
    'how.note': 'تستطيع الإيقاف المؤقت، والاستكمال، وإعادة الترتيب، والجدولة من الطابور.',

    'connections.eyebrow': 'توازٍ حسب التصميم',
    'connections.title': 'اتصالات أكثر. انتظار أقل.',
    'connections.lede':
      'اختر عدد الاتصالات التي يفتحها تيار لكل شبكة. الاتصالات الإضافية تفيد عندما يكون لدى الخادم سعة؛ لكنها لا تخلق سرعة غير موجودة.',
    'connections.consoleLabel': 'مختبر الاتصالات',
    'connections.panelLede': 'حدّد سقفاً لكل شبكة. تيار يتولى بقية الطابور.',
    'connections.point1': 'إعدادات من 2 إلى 32؛ وضع Turbo يرفعها إلى 64 لكل شبكة.',
    'connections.point2': 'كل مسار يبقى مرتبطاً بالشبكة التي اخترتها.',
    'connections.point3': 'الكتل تنتقل إلى الاتصال المتاح.',
    'connections.activeNetworks': 'الشبكات النشطة',
    'connections.perNetwork': 'اتصال لكل شبكة',
    'connections.presets': 'عدد الاتصالات لكل شبكة',
    'connections.turbo': 'TURBO',
    'connections.mapLabel': 'خريطة الاتصالات المتوازية',
    'connections.networksLabel': 'الشبكات النشطة',
    'connections.summary': 'عدد الاتصالات لكل شبكة: {streams} · الإجمالي: {total} مساراً نشطاً',
    'connections.footnote':
      'وضع Turbo مُعطّل افتراضياً. تصل الميزة إلى 64 اتصالاً لكل شبكة، وفقط عندما يتحمّل الخادم والقرص ذلك.',
    'connections.disclaimer':
      'توضيحي فقط — تعتمد السرعة الفعلية على الخادم ومزوّد الخدمة والعتاد لديك.',
    'network.wifi': 'Wi-Fi',
    'network.ethernet': 'إيثرنت',
    'network.usb': 'USB',

    'download.eyebrow': 'ويندوز 10 و11 · 64 بت',
    'download.title': 'جاهز عندما تكون جاهزاً.',
    'download.lede': 'ملف تثبيت واحد. بدون حساب. أحدث إصدار وبصمته بالأسفل.',
    'download.button': 'حمّل تيار',
    'download.releaseNotes': 'ملاحظات الإصدار',
    'download.releaseChannel': 'قناة الإصدار',
    'download.latest': 'الأحدث',
    'download.releaseLabel': 'الإصدار',
    'download.installerLabel': 'ملف التثبيت',
    'download.sizeLabel': 'الحجم',
    'download.platformLabel': 'المنصة',
    'download.platformValue': 'ويندوز 10 و11',
    'download.archLabel': 'المعمارية',
    'download.archValue': '64 بت',
    'download.licenseLabel': 'الرخصة',
    'download.licenseValue': 'MIT',
    'download.checksumLabel': 'SHA-256',
    'download.appIconAlt': 'أيقونة تطبيق تيار',
    'download.copyChecksum': 'نسخ بصمة SHA-256',
    'download.unsignedTitle': 'بخصوص تحذير SmartScreen',
    'download.unsignedBody':
      'ملف التثبيت غير موقّع رقمياً، لذا قد يعرض ويندوز تحذير SmartScreen. اختر More info ثم Run anyway، أو ابنِ التطبيق من المصدر. لا يملك المشروع شهادة توقيع كود بعد.',
    'download.source': 'الكود المصدري (MIT)',
    'download.extensionNote':
      'إضافة المتصفح ملف منفصل، وليست داخل المثبّت. حمّلها من زر الإضافة بالأسفل.',
    'download.whatsNew': 'الجديد في {version}',
    'download.whatsNew1': 'تعافٍ أفضل من استجابات الخادم البطيئة',
    'download.whatsNew2': 'فكّ ضغط الأرشيفات أثناء التنزيل',
    'download.whatsNew3': 'التشغيل مع ويندوز والبقاء في شريط النظام',
    'download.shaNote': 'تحقّق من الملف بعد التنزيل إن أردت.',
    'download.sizeNote': 'حجم التثبيت التقريبي',

    'extension.eyebrow': 'إضافة Chromium',
    'extension.title': 'دع المتصفح يسلّمها.',
    'extension.lede':
      'ثبّت الإضافة، وستفتح التحميلات في تيار بدلاً من رف التحميل في المتصفح — مع ملفات تعريف الارتباط.',
    'extension.button': 'حمّل الإضافة (.zip)',
    'extension.browsers': 'Chrome · Edge · Brave · Opera',
    'extension.supported': 'المتصفحات المدعومة',
    'extension.step1Title': 'حمّل وفكّ الضغط',
    'extension.step1Body': 'حمّل ملف zip من الزر أعلاه واستخرجه في مجلد تعرفه.',
    'extension.step2Title': 'افتح صفحة الإضافات',
    'extension.step2Body':
      'في Chrome أو Edge أو Brave أو Opera، افتح ‎chrome://extensions‎ وفعّل Developer mode.',
    'extension.step3Title': 'اختر Load unpacked',
    'extension.step3Body': 'اختر Load unpacked ثم حدّد مجلد chrome داخل الملف المستخرج.',
    'extension.step4Title': 'أرسل تحميلاً',
    'extension.step4Body': 'استخدم زر الإضافة أو قائمة النقر الأيمن. يجب أن يكون تيار قيد التشغيل.',
    'extension.manualTitle': 'تثبيت يدوي',
    'extension.manualBody':
      'الإضافة ليست على Chrome Web Store بعد، لذا لن يحدّثها المتصفح تلقائياً. أعد تنزيل ملف zip مع كل إصدار جديد.',
    'extension.privacyLink': 'اقرأ سياسة خصوصية الإضافة',
    'extension.localNote': 'تتواصل الإضافة مع تيار على 127.0.0.1 فقط. لا خوادم للمطوّر.',
    'extension.connected': 'متصل بتيار',
    'extension.send': 'أرسل إلى تيار',
    'extension.fileName': 'design-pack.zip',

    'faq.eyebrow': 'أسئلة، وأجوبة صريحة',
    'faq.title': 'النسخة الصادقة، بما فيها الحواف الخشنة.',
    'faq.lede': 'إذا لم تجد إجابتك، افتح تذكرة على GitHub.',
    'faq.q1': 'هل يدمج تيار اتصالاتي فعلاً؟',
    'faq.a1':
      'نعم — عندما تكون أكثر من شبكة نشطة ويدعم الخادم طلبات النطاق (Range). يقسّم الملف إلى كتل ويربط المسارات بواجهات مختلفة. الخادم الذي يحدّ اتصالاً واحداً، أو مزوّد خدمة يقيّد خطك، يظل سقفك.',
    'faq.q2': 'ما إصدارات ويندوز المدعومة؟',
    'faq.a2': 'ويندوز 10 و11 بنواة 64 بت. المثبّت الحالي مبني لمعمارية x64.',
    'faq.q3': 'هل هو مجاني؟',
    'faq.a3':
      'نعم. تيار مجاني ومفتوح المصدر تحت رخصة MIT، ومبني على Plexo. لا حساب، ولا اشتراك، ولا إعلانات.',
    'faq.q4': 'لماذا يحذرني ويندوز؟',
    'faq.a4':
      'المثبّت غير موقّع رقمياً، لذا لا يستطيع SmartScreen التحقق من الناشر. اختر More info ثم Run anyway، أو ابنِ التطبيق من المصدر. يتطلب التوقيع شهادة مدفوعة، ولا يملكها المشروع بعد.',
    'faq.q5': 'أين إضافة المتصفح؟',
    'faq.a5':
      'هي ملف zip منفصل، وليست داخل المثبّت وليست على Chrome Web Store. حمّلها من زر الإضافة بالأعلى وثبّتها يدويًا عبر Developer mode؛ الخطوات بالأعلى.',
    'faq.q6': 'أي أرشيفات تُفكّ أثناء التنزيل؟',
    'faq.a6':
      'ZIP وRAR وTAR، بما فيها ‎.tar.gz‎ و‎.tar.bz2‎ و‎.tar.xz‎. أما ‎.7z‎ والأرشيفات متعددة الأجزاء فلا تُفكّ أثناء التنزيل؛ نزّلها كاملة ثم استخرجها بأداتك المعتادة.',
    'faq.q7': 'هل سيجعل كل تحميل أسرع؟',
    'faq.a7':
      'لا. تيار يستفيد من الاتصالات وسعة الخادم المتاحة لديك. إذا كان الخادم يحدّك بمسار واحد بطيء، فلن تساعد الاتصالات الإضافية. وقد يضر Turbo بالأداء على عتاد ضعيف أو خوادم صارمة.',
    'faq.q8': 'هل يجمع بياناتي؟',
    'faq.a8':
      'يحفظ تيار الإعدادات وسجل التحميل على جهازك. تتواصل الإضافة مع تيار على 127.0.0.1 فقط — وليس مع خوادم المطوّر. راجع سياسة خصوصية الإضافة للتفاصيل.',
    'faq.q9': 'هل يدعم ملفات torrent؟',
    'faq.a9':
      'نعم، يمكن فتح ملفات ‎.torrent‎ وروابط magnet بواسطة تيار. المثبّت لا يستحوذ على ارتباطات torrent الافتراضية لديك.',
    'faq.more': 'لديك سؤال آخر؟',
    'faq.ask': 'افتح تذكرة على GitHub',

    'footer.tagline': 'مدير تحميل يستخدم كل اتصال لديك.',
    'footer.product': 'المنتج',
    'footer.project': 'المشروع',
    'footer.help': 'المساعدة',
    'footer.features': 'المزايا',
    'footer.download': 'التحميل',
    'footer.extension': 'إضافة المتصفح',
    'footer.release': 'أحدث إصدار',
    'footer.github': 'GitHub',
    'footer.issues': 'المشكلات والاقتراحات',
    'footer.license': 'رخصة MIT',
    'footer.privacy': 'الخصوصية',
    'footer.faq': 'الأسئلة الشائعة',
    'footer.basedOn': 'مبني على Plexo',
    'footer.rights': '© {year} مساهمو تيار.',
    'footer.disclaimer': 'غير مرتبط بـ Internet Download Manager أو Tonec Inc.',
    'footer.made': 'صُنع لويندوز',
    'footer.backTop': 'إلى الأعلى',
    'footer.language': 'اللغة',

    'common.copy': 'نسخ',
    'common.copied': 'تم النسخ',
    'common.copiedToast': 'تم نسخ بصمة SHA-256',
    'common.copyFailed': 'تعذّر النسخ — حدّد البصمة يدوياً',
    'common.skip': 'تجاوز إلى المحتوى',
    'common.close': 'إغلاق',
    'common.external': 'يفتح في نافذة جديدة',
    'common.version': 'الإصدار'
  },

  en: {
    'connections.summary': '{networks} networks × {streams} streams = {total} active streams',
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    'common.copiedToast': 'SHA-256 copied',
    'common.copyFailed': 'Could not copy — select the checksum manually',
    'theme.toLight': 'Switch to light theme',
    'theme.toDark': 'Switch to dark theme',
    'lang.switchToArabic': 'Switch to Arabic',
    'lang.switchToEnglish': 'Switch to English',
    'nav.menu': 'Open menu',
    'nav.closeMenu': 'Close menu',
    'lang.arabic': 'العربية',
    'lang.english': 'English'
  }
}
