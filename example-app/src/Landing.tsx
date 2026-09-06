import React, { useState } from 'react'
import { motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Check, Code2, Copy, Github, Layers3, MousePointer2, RotateCcw, Route, Sparkles, Terminal, Wand2 } from 'lucide-react'
import { Link } from '@drift/router/client'
import './landing.css'

const repository = 'https://github.com/ciphrnotfound/drift'
const command = 'npm create drift-app@latest'
const snippets = {
  Structure: `component ActionButton {\n  props {\n    label: string\n  }\n\n  render {\n    <button type="button">\n      {label}\n    </button>\n  }\n}`,
  Style: `component ActionButton {\n  style {\n    display: inline-flex\n    padding: 12px 24px\n    background: #245bff\n    color: #ffffff\n    border-radius: 6px\n\n    hover {\n      background: #1844cc\n    }\n  }\n}`,
  Motion: `component ActionButton {\n  motion {\n    enter {\n      opacity: 0, y: 8, duration: 0.2\n    }\n    hover { y: -2 }\n    press { scale: 0.98 }\n  }\n\n  render {\n    <button>Make something great</button>\n  }\n}`,
}

export function Landing() {
  const [tab, setTab] = useState<keyof typeof snippets>('Structure')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [replay, setReplay] = useState(0)
  const [pressed, setPressed] = useState(false)
  const reduced = useReducedMotion()
  async function copy() {
    try { await navigator.clipboard.writeText(command); setCopied(true); setCopyError(false) }
    catch { setCopyError(true) }
  }
  return <MotionConfig reducedMotion="user"><div className="lp">
    <section className="lp-hero lp-frame">
      <a className="lp-announcement" href={`${repository}/releases`}><span />Built in the open. Drift 0.1 alpha <ArrowUpRight size={13} /></a>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>Drift.<br /><span>Your next frontend.</span></motion.h1>
      <p className="lp-lede">From the first component to the finishing touch.<br className="lp-desktop" /> Structure, style, and motion. One expressive language.</p>
      <div className="lp-actions"><Link to="/language" className="lp-primary">Start building <ArrowRight size={16} /></Link><a className="lp-secondary" href={repository}><Github size={16} />Explore the source</a></div>
      <div className="lp-install"><Terminal size={14} /><code>{command}</code><button onClick={copy} aria-label="Copy install command" title="Copy install command">{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>
      <span className="lp-copy-status" role="status">{copyError ? 'Select the command above to copy it.' : copied ? 'Copied to clipboard' : 'Open source. React compatible. Yours to build with.'}</span>
      <div className="lp-workbench" id="playground">
        <div className="lp-workbench-top"><span><Code2 size={14} />ActionButton.drift</span><span className="lp-workbench-note">A closer look at the language</span><span className="lp-live"><i /> LIVE PREVIEW</span></div>
        <div className="lp-workbench-body"><div className="lp-editor">
          <div className="lp-tabs" role="tablist" aria-label="Component examples">{(Object.keys(snippets) as Array<keyof typeof snippets>).map((name) => <button key={name} role="tab" id={`tab-${name}`} aria-controls="lp-code" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>)}</div>
          <div className="lp-code" id="lp-code" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>{snippets[tab].split('\n').map((line, i) => <div key={`${tab}-${i}`}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><code className={/component|props|render|style|motion|hover|enter|press/.test(line) ? 'lp-code-key' : ''}>{line || ' '}</code></div>)}</div>
          <div className="lp-editor-footer"><span><span className="lp-blue-dot" />{tab.toLowerCase()} / component</span><span>DRIFT</span></div>
        </div><div className="lp-preview"><div className="lp-preview-top"><span>THE LITTLE DETAILS MATTER</span><button onClick={() => { setReplay(replay + 1); setPressed(false) }} title="Replay animation" aria-label="Replay animation"><RotateCcw size={14} /></button></div>
          <div className="lp-preview-stage"><span className="lp-measure lp-measure-top">a little less ceremony</span><motion.button key={replay} initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} whileHover={reduced ? undefined : { y: -3 }} whileTap={reduced ? undefined : { scale: .97 }} className="lp-demo-button" onClick={() => setPressed(!pressed)}>{pressed ? <Check size={17} /> : <Sparkles size={17} />}{pressed ? 'Something great, started.' : 'Make something great'}<ArrowRight size={16} /></motion.button><span className="lp-measure lp-measure-bottom">a little more possibility</span><MousePointer2 className="lp-cursor" size={22} /></div>
          <div className="lp-preview-bottom"><span><Check size={12} />Scoped styles</span><span><Check size={12} />React output</span><span><Check size={12} />Motion ready</span></div>
        </div></div>
      </div>
    </section>
    <section className="lp-ecosystem lp-frame"><p>A new language.<br /><strong>A familiar ecosystem.</strong></p><div><span>React</span><span>Tailwind CSS</span><span>shadcn/ui</span><span>Lucide</span><span>Framer Motion</span></div></section>
    <section className="lp-section lp-frame"><div className="lp-section-heading"><span className="lp-eyebrow">01 / MADE FOR THE FRONTEND</span><h2>Everything belongs<br /><span>right where you build.</span></h2><p>Keep the details of an interface together.<br />Let Drift turn them into familiar web output.</p></div>
      <div className="lp-features">
        <article><div className="lp-feature-visual lp-style-visual"><motion.div animate={reduced ? {} : { y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}><span /><span /><span /><span /></motion.div><code>style {'{'} scope: yours {'}'}</code></div><span className="lp-feature-label"><Layers3 size={16} />Style with intent.</span><p>Scoped CSS, shared design tokens, and responsive styles. Bring Tailwind when you need it.</p><Link to="/ui">Explore styling <ArrowUpRight size={14} /></Link></article>
        <article><div className="lp-feature-visual lp-motion-visual"><motion.span animate={reduced ? {} : { x: [-45, 45, -45], rotate: [0, 90, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}><Wand2 size={22} /></motion.span><span className="lp-motion-track" /><code>hover {'{'} y: -2 {'}'}</code></div><span className="lp-feature-label"><Sparkles size={16} />Give it a little life.</span><p>Describe movement alongside your component. Build hover, press, and entrance states into the experience.</p><Link to="/language">Meet the language <ArrowUpRight size={14} /></Link></article>
        <article><div className="lp-feature-visual lp-route-visual">{['pages/index.drift', 'pages/about.drift', 'pages/[slug].drift'].map((route, i) => <motion.div key={route} animate={reduced ? {} : { opacity: [.45, 1, .45] }} transition={{ duration: 4, repeat: Infinity, delay: i * .8 }}><Route size={13} /><code>{route}</code><ArrowUpRight size={12} /></motion.div>)}</div><span className="lp-feature-label"><Route size={16} />Go from page to product.</span><p>File-based routes, loaders, nested layouts, and route metadata give your frontend room to grow.</p><Link to="/seo">Explore route metadata <ArrowUpRight size={14} /></Link></article>
      </div>
    </section>
    <section className="lp-output lp-frame"><div><span className="lp-eyebrow">02 / NO BLACK BOX</span><h2>Your code.<br /><span>All the way through.</span></h2><p>Drift compiles to React and CSS. Inspect the output, use existing components, and keep building with the tools you know.</p><a href={`${repository}/tree/main/packages/compiler`}>Inside the compiler <ArrowUpRight size={15} /></a></div><div className="lp-output-diagram"><div className="lp-source-node"><Code2 size={20} /><span>Component.drift</span></div><div className="lp-connectors" /><div className="lp-output-nodes">{[['.tsx','React components'],['.css','Scoped styles'],['motion','Interaction states']].map(([extension, label], i) => <motion.div key={extension} whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: reduced ? 0 : 12 }} viewport={{ once: true }} transition={{ delay: i * .12 }}><code>{extension}</code><span>{label}</span><Check size={14} /></motion.div>)}</div></div></section>
    <section className="lp-close lp-frame"><span className="lp-eyebrow">SMALL BEGINNINGS. BEAUTIFUL INTERFACES.</span><h2>Make your next<br />idea <span>real.</span></h2><div className="lp-actions"><Link to="/language" className="lp-primary">Build with Drift <ArrowRight size={16} /></Link><a href={`${repository}/blob/main/CONTRIBUTING.md`} className="lp-secondary">Help shape Drift <Github size={16} /></a></div><p>Public alpha. Built for curious developers.<br />APIs are evolving, and your feedback matters.</p></section>
    <footer className="lp-footer lp-frame"><Link to="/" className="lp-footer-brand">drift<span>One language. Your interface.</span></Link><div><a href={`${repository}/blob/main/README.md`}>Documentation</a><a href={`${repository}/blob/main/CHANGELOG.md`}>Changelog</a><a href={repository}>GitHub <ArrowUpRight size={12} /></a></div><span>Open source / MIT</span></footer>
  </div></MotionConfig>
}
