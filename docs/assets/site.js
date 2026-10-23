/* Tayyar website behaviour.
 *
 * No framework, no tracking, no third-party requests. Everything here is either
 * progressive enhancement (links already work without it) or a small, local demo.
 */
;(() => {
  'use strict'

  const defaults = {
    version: '1.2.0',
    releaseUrl: 'https://github.com/bouadjadjatamer2-hub/tayyar-download-manager-/releases/latest',
    releaseTagUrl:
      'https://github.com/bouadjadjatamer2-hub/tayyar-download-manager-/releases/tag/v1.2.0',
    extensionUrl:
      'https://github.com/bouadjadjatamer2-hub/tayyar-download-manager-/releases/latest',
    githubUrl: 'https://github.com/bouadjadjatamer2-hub/tayyar-download-manager-',
    issuesUrl: 'https://github.com/bouadjadjatamer2-hub/tayyar-download-manager-/issues',
    licenseUrl:
      'https://github.com/bouadjadjatamer2-hub/tayyar-download-manager-/blob/main/LICENSE',
    plexoUrl: 'https://github.com/anmolkapil/plexo',
    privacyUrl: './extension/privacy/',
    installerName: 'Tayyar-1.2.0-Setup.exe',
    installerSize: '125.2 MB',
    sha256: '643DD40A89A86019B75A8BFE84FCDE6DF4C506371031313019EC49E4AABE2C6B',
    year: 2026
  }

  const config = Object.assign({}, defaults, window.TAYYAR_CONFIG || {})
  const messages = window.TAYYAR_I18N || { ar: {}, en: {} }
  const root = document.documentElement
  const motionQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false, addEventListener: null }

  const state = {
    lang: root.lang === 'ar' ? 'ar' : 'en',
    theme: root.dataset.theme === 'light' ? 'light' : 'dark',
    streams: 8,
    displayedStreams: 8,
    copied: false,
    menuOpen: false,
    countFrame: 0,
    speedTimer: 0,
    copyTimer: 0,
    menuTimer: 0,
    toastTimer: 0
  }

  const originals = new WeakMap()
  const englishTitle = document.title
  const descriptionMeta = document.querySelector('meta[name="description"]')
  const englishDescription = descriptionMeta ? descriptionMeta.getAttribute('content') || '' : ''

  const $ = (selector, context = document) => context.querySelector(selector)
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector))

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* Storage can be disabled; the current view still works. */
    }
  }

  function baseVars(extra = {}) {
    return Object.assign(
      {
        version: config.version,
        year: config.year,
        networks: 3,
        streams: state.streams,
        total: state.streams * 3
      },
      extra
    )
  }

  function interpolate(text, vars = {}) {
    return String(text).replace(/\{(\w+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
    )
  }

  function translate(key, lang = state.lang, vars = {}) {
    const table = messages[lang] || {}
    let value = table[key]
    if (value == null && lang !== 'en') value = (messages.en || {})[key]
    if (value == null) return null
    return interpolate(value, baseVars(vars))
  }

  /* -----------------------------------------------------------------------
     Config
     ----------------------------------------------------------------------- */

  function applyConfig() {
    const values = {
      versionPlain: () => config.version,
      installerName: () => config.installerName,
      installerSize: () => config.installerSize,
      sha256: () => config.sha256,
      year: () => String(config.year)
    }

    $$('[data-config]').forEach((element) => {
      const key = element.dataset.config
      let value = null

      if (key === 'version') {
        value = element.dataset.prefix === 'v' ? `v${config.version}` : config.version
      } else {
        const getter = values[key]
        value = getter ? getter() : null
      }

      if (value != null) element.textContent = value

      if (['version', 'versionPlain', 'installerName', 'installerSize', 'sha256'].includes(key)) {
        element.setAttribute('dir', 'ltr')
      }
    })

    const links = {
      release: config.releaseUrl,
      releaseTag: config.releaseTagUrl,
      extension: config.extensionUrl,
      github: config.githubUrl,
      issues: config.issuesUrl,
      license: config.licenseUrl,
      plexo: config.plexoUrl,
      privacy: config.privacyUrl
    }

    $$('[data-config-href]').forEach((element) => {
      const href = links[element.dataset.configHref]
      if (href) element.setAttribute('href', href)
    })

    const schema = document.getElementById('softwareSchema')
    if (schema) {
      try {
        const data = JSON.parse(schema.textContent)
        data.softwareVersion = config.version
        data.downloadUrl = config.releaseUrl
        data.license = config.licenseUrl
        if (data.author && typeof data.author === 'object') data.author.url = config.githubUrl
        data.sameAs = [config.githubUrl]
        schema.textContent = JSON.stringify(data)
      } catch {
        /* Keep the static structured data if it cannot be parsed. */
      }
    }
  }

  /* -----------------------------------------------------------------------
     Theme
     ----------------------------------------------------------------------- */

  const themeColorMeta = $('meta[name="theme-color"]')

  function updateThemeLabel() {
    const button = $('#themeToggle')
    if (!button) return

    const key = state.theme === 'dark' ? 'theme.toLight' : 'theme.toDark'
    const label =
      translate(key, state.lang) ||
      (state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')

    button.setAttribute('aria-label', label)
    button.setAttribute('title', label)
  }

  function applyTheme(theme, persist) {
    state.theme = theme === 'light' ? 'light' : 'dark'
    root.dataset.theme = state.theme

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', state.theme === 'light' ? '#F5F6FB' : '#0A0B10')
    }

    if (persist) storageSet('tayyar-theme', state.theme)
    updateThemeLabel()
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark', true)
  }

  /* -----------------------------------------------------------------------
     Language / RTL
     ----------------------------------------------------------------------- */

  function captureOriginals() {
    $$('[data-i18n]').forEach((element) => {
      originals.set(element, { kind: 'html', value: element.innerHTML })
    })

    $$('[data-i18n-html]').forEach((element) => {
      originals.set(element, { kind: 'html', value: element.innerHTML })
    })

    $$('[data-i18n-aria-label]').forEach((element) => {
      originals.set(element, {
        kind: 'attribute',
        attribute: 'aria-label',
        value: element.getAttribute('aria-label')
      })
    })

    $$('[data-i18n-alt]').forEach((element) => {
      originals.set(element, {
        kind: 'attribute',
        attribute: 'alt',
        value: element.getAttribute('alt')
      })
    })
  }

  function updateLanguageButtons() {
    const nextLabel =
      state.lang === 'ar'
        ? translate('lang.english', 'ar') || 'English'
        : translate('lang.arabic', 'en') || 'العربية'
    const nextLang = state.lang === 'ar' ? 'en' : 'ar'

    $$('[data-lang-label]').forEach((label) => {
      label.textContent = nextLabel
      label.setAttribute('lang', nextLang)
    })

    const buttonLabel =
      state.lang === 'ar'
        ? translate('lang.switchToEnglish', 'ar') || 'Switch to English'
        : translate('lang.switchToArabic', 'en') || 'Switch to Arabic'

    $$('#langToggle,[data-lang-toggle]').forEach((button) => {
      button.setAttribute('aria-label', buttonLabel)
      button.setAttribute('title', buttonLabel)
    })
  }

  function syncCopyLabel() {
    const label = $('[data-copy-label]')
    if (!label) return

    const key = state.copied ? 'common.copied' : 'common.copy'
    label.textContent = translate(key, state.lang) || (state.copied ? 'Copied' : 'Copy')

    const copyButton = $('#copyChecksum')
    if (copyButton) {
      const ariaKey = state.copied ? 'common.copied' : 'download.copyChecksum'
      const ariaLabel = translate(ariaKey, state.lang)
      if (ariaLabel) copyButton.setAttribute('aria-label', ariaLabel)
    }
  }

  function updateConnectionsSummary() {
    const summary = $('[data-connections-summary]')
    if (!summary) return

    const text = translate('connections.summary', state.lang, {
      networks: 3,
      streams: state.streams,
      total: state.streams * 3
    })

    if (text) summary.textContent = text
  }

  function updateMenuLabel() {
    const button = $('#menuToggle')
    if (!button) return

    const key = state.menuOpen ? 'nav.closeMenu' : 'nav.menu'
    const fallback = state.menuOpen ? 'Close menu' : 'Open menu'
    const label = translate(key, state.lang) || fallback

    button.setAttribute('aria-label', label)
    button.setAttribute('title', label)
  }

  function applyLanguage(lang, persist) {
    state.lang = lang === 'ar' ? 'ar' : 'en'
    root.lang = state.lang
    root.dir = state.lang === 'ar' ? 'rtl' : 'ltr'
    if (persist) storageSet('tayyar-lang', state.lang)

    $$('[data-i18n]').forEach((element) => {
      const saved = originals.get(element)
      const key = element.dataset.i18n

      if (state.lang === 'ar') {
        const value = translate(key, 'ar')
        if (value != null) {
          element.textContent = value
        } else if (saved) {
          element.innerHTML = interpolate(saved.value, baseVars())
        }
      } else if (saved) {
        element.innerHTML = interpolate(saved.value, baseVars())
      }
    })

    $$('[data-i18n-html]').forEach((element) => {
      const saved = originals.get(element)
      const key = element.dataset.i18nHtml

      if (state.lang === 'ar') {
        const value = translate(key, 'ar')
        if (value != null) {
          element.innerHTML = value
        } else if (saved) {
          element.innerHTML = interpolate(saved.value, baseVars())
        }
      } else if (saved) {
        element.innerHTML = interpolate(saved.value, baseVars())
      }
    })

    $$('[data-i18n-aria-label]').forEach((element) => {
      const saved = originals.get(element)
      const key = element.dataset.i18nAriaLabel
      if (!saved || saved.kind !== 'attribute') return

      if (state.lang === 'ar') {
        const value = translate(key, 'ar')
        if (value != null) {
          element.setAttribute(saved.attribute, value)
        } else if (saved.value != null) {
          element.setAttribute(saved.attribute, interpolate(saved.value, baseVars()))
        }
      } else if (saved.value != null) {
        element.setAttribute(saved.attribute, interpolate(saved.value, baseVars()))
      }
    })

    $$('[data-i18n-alt]').forEach((element) => {
      const saved = originals.get(element)
      const key = element.dataset.i18nAlt
      if (!saved || saved.kind !== 'attribute') return

      if (state.lang === 'ar') {
        const value = translate(key, 'ar')
        if (value != null) {
          element.setAttribute(saved.attribute, value)
        } else if (saved.value != null) {
          element.setAttribute(saved.attribute, interpolate(saved.value, baseVars()))
        }
      } else if (saved.value != null) {
        element.setAttribute(saved.attribute, interpolate(saved.value, baseVars()))
      }
    })

    if (state.lang === 'ar') {
      document.title = translate('meta.title', 'ar') || englishTitle
      if (descriptionMeta) {
        descriptionMeta.setAttribute(
          'content',
          translate('meta.description', 'ar') || englishDescription
        )
      }
    } else {
      document.title = englishTitle
      if (descriptionMeta) descriptionMeta.setAttribute('content', englishDescription)
    }

    state.copied = false
    window.clearTimeout(state.copyTimer)
    window.clearTimeout(state.toastTimer)
    const toast = $('#toast')
    if (toast) toast.classList.remove('is-visible')
    updateLanguageButtons()
    updateThemeLabel()
    updateMenuLabel()
    syncCopyLabel()
    updateConnectionsSummary()
  }

  function toggleLanguage() {
    applyLanguage(state.lang === 'ar' ? 'en' : 'ar', true)
  }

  /* -----------------------------------------------------------------------
     Header, scroll spy and mobile menu
     ----------------------------------------------------------------------- */

  function initNav() {
    const header = $('#siteHeader')
    const navLinks = $$('[data-nav]')
    const sections = $$('main section[id]')
    if (!header || !navLinks.length || !sections.length) return

    let activeId = ''
    let ticking = false

    const setActive = (id) => {
      if (id === activeId) return
      activeId = id

      navLinks.forEach((link) => {
        const isActive = link.dataset.nav === id
        link.classList.toggle('is-active', isActive)
        if (isActive) {
          link.setAttribute('aria-current', 'location')
        } else {
          link.removeAttribute('aria-current')
        }
      })
    }

    const update = () => {
      ticking = false
      header.classList.toggle('is-scrolled', window.scrollY > 8)

      const navHeight = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 72
      const line = window.scrollY + navHeight + 70
      let current = ''

      sections.forEach((section) => {
        const top = section.getBoundingClientRect().top + window.scrollY
        if (top <= line) current = section.id
      })

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = 'faq'
      }

      setActive(current)
    }

    const requestUpdate = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    update()
  }

  function initMenu() {
    const toggle = $('#menuToggle')
    const menu = $('#mobileMenu')
    if (!toggle || !menu) return

    const firstLink = $('a', menu)
    const background = [$('main'), $('footer')].filter(Boolean)

    const setBackgroundInert = (inert) => {
      background.forEach((element) => {
        if (inert) element.setAttribute('inert', '')
        else element.removeAttribute('inert')
      })
    }

    const open = () => {
      if (state.menuOpen) return
      state.menuOpen = true
      window.clearTimeout(state.menuTimer)
      menu.hidden = false
      document.body.classList.add('menu-open')
      toggle.setAttribute('aria-expanded', 'true')
      setBackgroundInert(true)
      updateMenuLabel()

      window.requestAnimationFrame(() => menu.classList.add('is-open'))

      if (firstLink) {
        window.setTimeout(() => firstLink.focus({ preventScroll: true }), 80)
      }
    }

    const close = (restoreFocus = true) => {
      if (!state.menuOpen) return
      state.menuOpen = false
      menu.classList.remove('is-open')
      document.body.classList.remove('menu-open')
      toggle.setAttribute('aria-expanded', 'false')
      setBackgroundInert(false)
      updateMenuLabel()

      window.clearTimeout(state.menuTimer)
      state.menuTimer = window.setTimeout(() => {
        if (!state.menuOpen) menu.hidden = true
      }, 190)

      if (restoreFocus) toggle.focus({ preventScroll: true })
    }

    toggle.addEventListener('click', () => {
      if (state.menuOpen) close()
      else open()
    })

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) close(false)
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.menuOpen) close()
    })

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1080 && state.menuOpen) close(false)
    })
  }

  /* -----------------------------------------------------------------------
     Reveals
     ----------------------------------------------------------------------- */

  function initReveals() {
    const elements = $$('.reveal')
    if (!elements.length) return

    if (motionQuery.matches || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries, instance) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          instance.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    )

    elements.forEach((element) => observer.observe(element))
  }

  /* -----------------------------------------------------------------------
     Connection demo
     ----------------------------------------------------------------------- */

  function initConnections() {
    const count = $('[data-stream-count]')
    const presets = $$('[data-streams]')
    const cells = $$('.stream-cell')
    if (!count || !presets.length || !cells.length) return

    const pad = (value) => String(value).padStart(2, '0')

    const animateCount = (target) => {
      window.cancelAnimationFrame(state.countFrame)

      if (motionQuery.matches || state.displayedStreams === target) {
        state.displayedStreams = target
        count.textContent = pad(target)
        return
      }

      const from = state.displayedStreams
      const started = performance.now()
      const duration = 320

      const tick = (now) => {
        const progress = Math.min(1, (now - started) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        const value = Math.round(from + (target - from) * eased)
        state.displayedStreams = value
        count.textContent = pad(value)

        if (progress < 1) {
          state.countFrame = window.requestAnimationFrame(tick)
        } else {
          state.displayedStreams = target
          count.textContent = pad(target)
        }
      }

      state.countFrame = window.requestAnimationFrame(tick)
    }

    const select = (value, animate) => {
      const safeValue = Math.max(1, Math.min(64, Number(value) || 8))
      state.streams = safeValue

      presets.forEach((button) => {
        button.setAttribute('aria-pressed', String(Number(button.dataset.streams) === safeValue))
      })

      cells.forEach((cell, index) => {
        cell.classList.toggle('is-on', index < safeValue)
      })

      if (animate) animateCount(safeValue)
      else {
        state.displayedStreams = safeValue
        count.textContent = pad(safeValue)
      }

      updateConnectionsSummary()
    }

    presets.forEach((button) => {
      button.addEventListener('click', () => select(button.dataset.streams, true))
    })

    select(state.streams, false)
  }

  /* -----------------------------------------------------------------------
     Checksum copy + toast
     ----------------------------------------------------------------------- */

  function showToast(message) {
    const toast = $('#toast')
    if (!toast) return

    window.clearTimeout(state.toastTimer)
    toast.textContent = message
    toast.classList.add('is-visible')

    state.toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible')
    }, 2600)
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-999px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()

    let succeeded = false
    try {
      succeeded = document.execCommand('copy')
    } catch {
      succeeded = false
    }

    area.remove()
    if (!succeeded) throw new Error('Copy command failed')
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return
      } catch {
        /* Permission denied or an embedded browser; try the old path below. */
      }
    }
    fallbackCopy(text)
  }

  function initCopy() {
    const button = $('#copyChecksum')
    if (!button) return

    button.addEventListener('click', async () => {
      try {
        await copyText(config.sha256)
        state.copied = true
        syncCopyLabel()
        showToast(translate('common.copiedToast', state.lang) || 'SHA-256 copied')

        window.clearTimeout(state.copyTimer)
        state.copyTimer = window.setTimeout(() => {
          state.copied = false
          syncCopyLabel()
        }, 2200)
      } catch {
        showToast(
          translate('common.copyFailed', state.lang) ||
            'Could not copy — select the checksum manually'
        )
      }
    })
  }

  /* -----------------------------------------------------------------------
     Hero live numbers
     ----------------------------------------------------------------------- */

  function initHeroDemo() {
    const speed = $('#mockSpeed')
    if (!speed) return

    const values = [42.8, 43.6, 41.9, 44.2, 42.4, 43.1]
    let index = 0

    const stop = () => {
      if (state.speedTimer) {
        window.clearInterval(state.speedTimer)
        state.speedTimer = 0
      }
    }

    const start = () => {
      stop()
      if (motionQuery.matches) return

      state.speedTimer = window.setInterval(() => {
        if (document.hidden) return
        index = (index + 1) % values.length
        speed.textContent = values[index].toFixed(1)
      }, 2900)
    }

    start()

    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', () => {
        start()
        if (motionQuery.matches) speed.textContent = '42.8'
      })
    }
  }

  /* -----------------------------------------------------------------------
     Boot
     ----------------------------------------------------------------------- */

  function initialLanguage() {
    const query = new URLSearchParams(window.location.search).get('lang')
    if (query === 'ar' || query === 'en') return query

    const stored = storageGet('tayyar-lang')
    if (stored === 'ar' || stored === 'en') return stored

    return state.lang
  }

  function initialTheme() {
    const stored = storageGet('tayyar-theme')
    if (stored === 'light' || stored === 'dark') return stored
    return state.theme
  }

  applyConfig()
  applyTheme(initialTheme(), false)
  captureOriginals()
  applyLanguage(initialLanguage(), false)

  initNav()
  initMenu()
  initReveals()
  initConnections()
  initCopy()
  initHeroDemo()

  const themeButton = $('#themeToggle')
  if (themeButton) themeButton.addEventListener('click', toggleTheme)

  $$('#langToggle,[data-lang-toggle]').forEach((button) => {
    button.addEventListener('click', toggleLanguage)
  })
})()
