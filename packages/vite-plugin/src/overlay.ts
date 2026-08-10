/** Lightweight, clickable Drift diagnostics for local development. */

function driftDevDiagnostics(hot: { on(event: string, callback: (data: any) => void): void }) {
  if (typeof window === 'undefined' || !hot) return

  const ROOT_ID = 'drift-dev-diagnostics'
  const errors: Array<{ file: string; message: string; frame: string }> = []

  const escape = (value: unknown) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  function ensureRoot() {
    let root = document.getElementById(ROOT_ID)
    if (root) return root

    root = document.createElement('div')
    root.id = ROOT_ID
    root.innerHTML = `
      <style>
        #${ROOT_ID}{position:fixed;left:18px;bottom:18px;z-index:2147483647;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111827}
        #${ROOT_ID} *{box-sizing:border-box}
        .drift-dev-button{display:flex;align-items:center;gap:9px;height:40px;padding:0 12px;border:1px solid #dbe3f0;border-radius:8px;background:rgba(255,255,255,.96);box-shadow:0 10px 30px rgba(15,23,42,.14);cursor:pointer;font:600 12px inherit;color:#172033;backdrop-filter:blur(14px)}
        .drift-dev-button:hover{border-color:#2563eb;transform:translateY(-1px)}
        .drift-dev-mark{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:#2563eb;color:#fff;font-weight:750}
        .drift-dev-count{display:grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#fee2e2;color:#b91c1c;font-size:11px}
        .drift-dev-panel{position:absolute;left:0;bottom:50px;width:min(680px,calc(100vw - 36px));max-height:min(620px,calc(100vh - 90px));overflow:auto;border:1px solid #dbe3f0;border-radius:10px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.2);display:none}
        .drift-dev-panel[data-open="true"]{display:block;animation:drift-panel-in .18s cubic-bezier(.22,1,.36,1)}
        .drift-dev-head{display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-bottom:1px solid #e8edf5}
        .drift-dev-head strong{font-size:13px}.drift-dev-head span{color:#64748b;font-size:11px}
        .drift-dev-close{width:28px;height:28px;border:0;border-radius:6px;background:#f1f5f9;color:#475569;cursor:pointer}
        .drift-dev-error{padding:18px 16px}.drift-dev-file{color:#2563eb;font:500 11px ui-monospace,SFMono-Regular,Consolas,monospace}.drift-dev-message{margin:10px 0 14px;color:#172033;font-size:14px;line-height:1.55}.drift-dev-frame{margin:0;padding:14px;border:1px solid #1e293b;border-radius:7px;background:#0b1020;color:#cbd5e1;overflow:auto;font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap}
        @keyframes drift-panel-in{from{opacity:0;transform:translateY(8px) scale(.99)}to{opacity:1;transform:none}}
        @media(max-width:600px){#${ROOT_ID}{left:10px;bottom:10px}.drift-dev-panel{width:calc(100vw - 20px);max-height:70vh}}
        @media(prefers-reduced-motion:reduce){.drift-dev-panel{animation:none!important}.drift-dev-button:hover{transform:none}}
      </style>
      <section class="drift-dev-panel" data-open="false" aria-label="Drift development errors"></section>
      <button class="drift-dev-button" type="button" aria-label="Open Drift diagnostics" aria-expanded="false">
        <span class="drift-dev-mark">D</span>
        <span>Drift diagnostics</span>
        <span class="drift-dev-count">0</span>
      </button>`

    document.body.appendChild(root)
    const button = root.querySelector<HTMLButtonElement>('.drift-dev-button')!
    const panel = root.querySelector<HTMLElement>('.drift-dev-panel')!
    button.addEventListener('click', () => {
      const open = panel.dataset.open !== 'true'
      panel.dataset.open = String(open)
      button.setAttribute('aria-expanded', String(open))
    })
    return root
  }

  function render() {
    const root = ensureRoot()
    const panel = root.querySelector<HTMLElement>('.drift-dev-panel')!
    const count = root.querySelector<HTMLElement>('.drift-dev-count')!
    count.textContent = String(errors.length)
    const current = errors[errors.length - 1]!
    panel.innerHTML = `
      <header class="drift-dev-head"><div><strong>Drift could not compile this surface</strong><br><span>${errors.length} active diagnostic${errors.length === 1 ? '' : 's'}</span></div><button class="drift-dev-close" aria-label="Close diagnostics">&times;</button></header>
      <div class="drift-dev-error"><div class="drift-dev-file">${escape(current.file || 'Unknown file')}</div><div class="drift-dev-message">${escape(current.message || 'Unexpected compilation error')}</div>${current.frame ? `<pre class="drift-dev-frame">${escape(current.frame)}</pre>` : ''}</div>`
    panel.querySelector('.drift-dev-close')?.addEventListener('click', () => {
      panel.dataset.open = 'false'
      root.querySelector('.drift-dev-button')?.setAttribute('aria-expanded', 'false')
    })
  }

  hot.on('vite:error', (data: { err?: { file?: string; message?: string; frame?: string } }) => {
    if (!data.err) return
    errors.push({ file: data.err.file || '', message: (data.err.message || '').replace(/vite/gi, 'Drift'), frame: data.err.frame || '' })
    if (errors.length > 10) errors.shift()
    render()
  })

  hot.on('vite:beforeUpdate', () => {
    errors.length = 0
    document.getElementById(ROOT_ID)?.remove()
  })

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const panel = document.querySelector<HTMLElement>(`#${ROOT_ID} .drift-dev-panel`)
      if (panel) panel.dataset.open = 'false'
    }
  })
}

export const overlayScript = `(${driftDevDiagnostics.toString()})(import.meta.hot);`
