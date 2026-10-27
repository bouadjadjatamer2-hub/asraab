/* DroidCrate page behaviour: the illustrative command gate.
 *
 * The result panel is the only dynamic part of the page. Every command listed in
 * the HTML has a matching entry in window.DROIDCRATE_GATE, so selecting a button
 * only swaps copy that already exists in both languages — nothing is fetched and
 * nothing is executed.
 */
;(function () {
  const result = document.querySelector('[data-gate-result]')
  const buttons = Array.from(document.querySelectorAll('[data-gate]'))
  if (!result || !buttons.length) return

  const statusNode = result.querySelector('[data-gate-status]')
  const flagNode = result.querySelector('[data-gate-flag]')
  const codeNode = result.querySelector('[data-gate-code]')
  const descNode = result.querySelector('[data-gate-desc]')
  const noteNode = result.querySelector('[data-gate-note]')

  const root = document.documentElement
  let selected = buttons.find((button) => button.getAttribute('aria-pressed') === 'true')
  if (!selected) selected = buttons[0]

  function language() {
    return root.lang === 'ar' ? 'ar' : 'en'
  }

  function copy() {
    const table = window.DROIDCRATE_GATE || {}
    return table[language()] || table.en || {}
  }

  function render() {
    const entry = copy()[selected.dataset.gate]
    if (!entry) return

    result.dataset.level = entry.level
    if (statusNode) statusNode.textContent = entry.status
    if (flagNode) flagNode.textContent = entry.flag
    if (codeNode) codeNode.textContent = selected.querySelector('code').textContent.trim()
    if (descNode) descNode.textContent = entry.desc
    if (noteNode) noteNode.textContent = entry.note
  }

  function select(button) {
    selected = button
    buttons.forEach((candidate) => {
      candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false')
    })
    render()
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => select(button))
  })

  /* site.js swaps language by changing lang/dir on <html> without firing an
     event, so watch the attribute instead of duplicating its click handlers. */
  if (typeof MutationObserver === 'function') {
    new MutationObserver(render).observe(root, {
      attributes: true,
      attributeFilter: ['lang', 'dir']
    })
  }

  render()
})()
