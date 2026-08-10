import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, Router, useNavigation, useRoute } from '@drift/router/client'
import { Accessibility, ArrowRight, Blocks, Boxes, Braces, Check, ChevronRight, CircleCheck, Cloud, Code2, Component, Copy, Database, FileCode2, Flame, Gauge, Github, Globe2, Layers3, LockKeyhole, Palette, Rocket, Route as RouteIcon, Search, Server, Sparkles, Terminal, Type, WandSparkles, Workflow, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { installDriftFonts, manrope } from './fonts'

installDriftFonts()

const sectionReveal = { hidden: { opacity: 0, y: 34 }, show: { opacity: 1, y: 0, transition: { duration: .65, ease: [0.22, 1, 0.36, 1] } } }
const staggerReveal = { hidden: {}, show: { transition: { staggerChildren: .09 } } }
const itemReveal = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: .45, ease: [0.22, 1, 0.36, 1] } } }

const routes = [
  { id: 'home', path: '/', component: 'HomePage', componentInstance: HomePage },
  { id: 'language', path: '/language', component: 'LanguagePage', componentInstance: LanguagePage },
  { id: 'seo', path: '/seo', component: 'SEOPage', componentInstance: SEOPage },
  { id: 'ui', path: '/ui', component: 'UIPage', componentInstance: UIPage },
]

const features = [
  ['01', 'Language', 'Typed components, render trees, metadata, and motion in one readable source.'],
  ['02', 'Drift Style', 'Responsive groups, variants, tokens, and scoped CSS with zero runtime styling.'],
  ['03', 'Routing', 'Instant client navigation with prefetching, loaders, and route-owned metadata.'],
  ['04', 'Drift Fonts', 'Google and local fonts with automatic classes, variables, preloads, and fallback CSS.'],
  ['05', 'SEO', 'Canonical URLs, social cards, JSON-LD, robots, and sitemap output at export time.'],
]

const featureIcons = [Code2, Palette, RouteIcon, Type, Search]

const testimonials = [
  ['Maya Chen', '@mayacodes', 'Drift feels like somebody finally designed the whole frontend workflow at once. The route file is the product surface.'],
  ['Ravi Patel', '@ravi_builds', 'The styling model is compact without becoming cryptic. We shipped the redesign with no runtime CSS dependency.'],
  ['Elena Soto', '@elenasoto', 'Fonts, metadata, routing, and components sharing one compiler makes the output remarkably predictable.'],
  ['Noah Williams', '@noahw', 'The best part is how little ceremony remains. It reads like the interface we intended to build.'],
  ['Ari Kim', '@arikim', 'Static export is fast, the pages are clean, and search metadata no longer depends on someone remembering every tag.'],
  ['Sam Okafor', '@samships', 'Drift has the tight feedback loop I want from a language and the polished defaults I expect from a framework.'],
]

export default function App() {
  return (
    <main className={`site-shell ${manrope.className}`}>
      <Router routes={routes} notFoundComponent={NotFoundPage} />
    </main>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const route = useRoute()
  const navigation = useNavigation()
  return (
    <>
      <header className="nav-shell">
        <nav className="nav">
          <Link className="brand" to="/"><DriftLogo /><span>drift</span></Link>
          <div className="nav-links">
            <Link to="/language" activeClassName="active-link" pendingClassName="pending-link">Language</Link>
            <Link to="/seo" activeClassName="active-link" pendingClassName="pending-link">SEO</Link>
            <Link to="/ui" activeClassName="active-link" pendingClassName="pending-link">Components</Link>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-meta"><a href="https://github.com" className="icon-link" aria-label="GitHub"><Github size={16} /></a><Link to="/language" className="nav-action">Start building <ArrowRight size={14} /></Link></div>
        </nav>
        <AnimatePresence>{navigation.isNavigating && <motion.div className="route-progress" initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: .82, opacity: 1 }} exit={{ scaleX: 1, opacity: 0 }} transition={{ duration: .22 }} />}</AnimatePresence>
      </header>
      <AnimatePresence mode="sync" initial={false}>
        <motion.div key={route?.route.path || 'missing'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function HomePage() {
  usePageMeta('Drift - The frontend language for the whole web', 'Build typed components, scoped styles, motion, routes, fonts, and static SEO in one frontend language.', '/')

  return (
    <Shell>
      <div className="drift-home">
        <section className="dh-hero">
          <motion.div className="dh-hero-copy" initial="hidden" animate="show" variants={staggerReveal}>
            <motion.a className="dh-release" href="#compiler" variants={itemReveal}><Sparkles size={13} /> Drift 0.1 public alpha <ChevronRight size={13} /></motion.a>
            <motion.h1 variants={itemReveal}>The frontend language<br />for the <span>whole web.</span></motion.h1>
            <motion.p variants={itemReveal}>Components, style, motion, routes, fonts, and metadata in one typed language. Compile to lean React and bring the ecosystem you already trust.</motion.p>
            <motion.div className="dh-actions" variants={itemReveal}><Link to="/language" className="dh-primary">Start building <ArrowRight size={15} /></Link><a className="dh-secondary" href="#ecosystem"><Github size={15} /> View on GitHub</a></motion.div>
            <motion.div className="dh-command" variants={itemReveal}><Terminal size={15} /><code>pnpm create drift@latest</code><button aria-label="Copy install command"><Copy size={14} /></button></motion.div>
          </motion.div>

          <motion.div className="dh-stage" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18, duration: .7 }}>
            <div className="dh-stage-bar"><span><i /><i /><i /></span><b>app/routes/index.drift</b><span>Drift</span></div>
            <div className="dh-stage-body">
              <pre><code><em>page</em> Home {'{\n'}  metadata {'{\n'}    title: <strong>"Acme"</strong>{'\n'}    description: <strong>"Built with Drift"</strong>{'\n'}  {'}\n\n'}  style {'{\n'}    font: $font.manrope{'\n'}    color: $color.ink{'\n'}  {'}\n\n'}  render {'{\n'}    {'<Hero />\n'}    {'<ProductGrid />\n'}  {'}\n}'}</code></pre>
              <motion.div className="dh-preview" animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}><span className="dh-preview-tag"><Zap size={12} /> LIVE OUTPUT</span><div className="dh-mini-nav"><DriftLogo /><i /><i /></div><div className="dh-mini-copy"><small>THE FASTER FRONTEND</small><strong>Interfaces that<br />ship ready.</strong><p>Typed. Styled. Discoverable.</p><button>Explore <ArrowRight size={12} /></button></div></motion.div>
            </div>
            <motion.div className="dh-scan" animate={{ left: ['4%', '92%', '4%'] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.div>
        </section>

        <section className="dh-proof" aria-label="Drift output targets">
          <div><strong>0 KB</strong><span>runtime styling</span></div><div><strong>Typed</strong><span>React output</span></div><div><strong>Instant</strong><span>client routes</span></div><div><strong>Static</strong><span>SEO artifacts</span></div>
        </section>

        <section className="dh-section" id="compiler">
          <SectionIntro eyebrow="ONE COMPILER" title="Write the interface. Drift handles the stack." text="A single source file becomes the pieces a production frontend actually needs, without hiding the output." />
          <motion.div className="dh-pipeline" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-120px' }} variants={staggerReveal}>
            <PipelineStep icon={FileCode2} number="01" title="Author" text="Typed components, variants, motion, metadata, and responsive style." />
            <PipelineStep icon={Workflow} number="02" title="Compile" text="Drift resolves tokens, route data, fonts, CSS, and component boundaries." />
            <PipelineStep icon={Rocket} number="03" title="Ship" text="Lean React, scoped CSS, static metadata, and prefetched client routes." />
          </motion.div>
        </section>

        <section className="dh-ecosystem" id="ecosystem">
          <div className="dh-section dh-ecosystem-inner">
            <motion.div className="dh-ecosystem-copy" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }} variants={staggerReveal}>
              <motion.p className="dh-kicker" variants={itemReveal}>YOUR COMPONENTS, STILL YOURS</motion.p>
              <motion.h2 variants={itemReveal}>Use the React ecosystem.<br /><span>Keep Drift in control.</span></motion.h2>
              <motion.p variants={itemReveal}>Import shadcn/ui, Hugeicons, Lucide, Radix, or your own React components directly inside a `.drift` file. Tailwind stays optional.</motion.p>
              <motion.div className="dh-library-list" variants={itemReveal}>{['shadcn/ui', 'Hugeicons', 'Lucide', 'Radix UI', 'Tailwind CSS'].map((name, i) => <span key={name}><CircleCheck size={14} />{name}<small>{i === 4 ? 'optional' : 'ready'}</small></span>)}</motion.div>
              <motion.div variants={itemReveal}><Link to="/ui" className="dh-text-link">Explore component interop <ArrowRight size={14} /></Link></motion.div>
            </motion.div>
            <motion.div className="dh-ui-preview" initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .65 }}>
              <div className="dh-window-bar"><span>Interface preview</span><div><i /><i /><i /></div></div>
              <div className="dh-app-shell"><aside><DriftLogo /><button className="active"><Boxes size={15} />Overview</button><button><Component size={15} />Components</button><button><Palette size={15} />Tokens</button></aside><div className="dh-app-main"><header><div><small>Workspace</small><strong>Frontend system</strong></div><button aria-label="Search components"><Search size={14} /></button></header><div className="dh-app-stats"><span><small>Components</small><strong>48</strong></span><span><small>Routes</small><strong>12</strong></span><span><small>Build</small><strong>684ms</strong></span></div><div className="dh-activity"><span>Recent output</span>{['Navigation.drift', 'ProductCard.drift', 'pricing/index.drift'].map((x, i) => <motion.div key={x} animate={{ opacity: [.55, 1, .55] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * .35 }}><FileCode2 size={14} /><b>{x}</b><small>ready</small></motion.div>)}</div></div></div>
            </motion.div>
          </div>
        </section>

        <section className="dh-section dh-fullstack">
          <SectionIntro eyebrow="BACKEND READY" title="Bring your data layer today." text="Drift keeps frontend code portable while normal ESM imports connect your app to the services you already use. Native Drift server primitives come next." />
          <div className="dh-integration-layout">
            <motion.div className="dh-integrations" initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerReveal}>
              <Integration icon={Database} name="Supabase" detail="Auth, Postgres, storage, and realtime through the official client." tone="green" />
              <Integration icon={Flame} name="Firebase" detail="Authentication, Firestore, functions, and storage through the web SDK." tone="amber" />
              <Integration icon={Cloud} name="Any API" detail="Use fetch, typed clients, or your existing React data layer." tone="blue" />
            </motion.div>
            <motion.div className="dh-server-map" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: .7 }}><div className="dh-map-node source"><DriftLogo /><span>DRIFT ROUTE</span></div><motion.i className="dh-map-line one" animate={{ scaleX: [0, 1, 1], opacity: [0, 1, .4] }} transition={{ duration: 2.6, repeat: Infinity }} /><motion.i className="dh-map-line two" animate={{ scaleX: [0, 1, 1], opacity: [0, 1, .4] }} transition={{ duration: 2.6, repeat: Infinity, delay: .7 }} /><motion.i className="dh-map-line three" animate={{ scaleX: [0, 1, 1], opacity: [0, 1, .4] }} transition={{ duration: 2.6, repeat: Infinity, delay: 1.4 }} /><div className="dh-map-node target one"><Database size={17} /><span>DATA</span></div><div className="dh-map-node target two"><LockKeyhole size={17} /><span>AUTH</span></div><div className="dh-map-node target three"><Server size={17} /><span>API</span></div><span className="dh-planned">NATIVE SERVER LAYER / PLANNED</span></motion.div>
          </div>
        </section>

        <section className="dh-output">
          <div className="dh-section">
            <SectionIntro eyebrow="PRODUCTION OUTPUT" title="Fast because the language knows more." text="Drift can optimize the route, styles, fonts, and metadata together before any browser work begins." inverse />
            <motion.div className="dh-output-grid" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }} variants={staggerReveal}>
              <OutputCard icon={Gauge} value="0 KB" title="Runtime style engine" text="Scoped CSS is emitted at build time." />
              <OutputCard icon={Globe2} value="100" title="SEO target" text="Canonical, Open Graph, robots, and sitemap output." />
              <OutputCard icon={Zap} value="<120ms" title="Route target" text="Prefetched navigation with immediate URL updates." />
              <OutputCard icon={Type} value="1 call" title="Optimized fonts" text="Google and local font classes, variables, and preloads." />
            </motion.div>
          </div>
        </section>

        <section className="dh-final"><motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerReveal}><motion.span variants={itemReveal}><DriftLogo large /></motion.span><motion.h2 variants={itemReveal}>One language.<br />A sharper frontend.</motion.h2><motion.p variants={itemReveal}>Start with the UI. Keep the path to full stack open.</motion.p><motion.div className="dh-actions" variants={itemReveal}><Link to="/language" className="dh-primary">Read the language <ArrowRight size={15} /></Link><Link to="/ui" className="dh-secondary">Browse components</Link></motion.div></motion.div></section>
      </div>
      <Footer />
    </Shell>
  )
}

function SectionIntro({ eyebrow, title, text, inverse = false }: { eyebrow: string; title: string; text: string; inverse?: boolean }) { return <motion.div className={`dh-intro ${inverse ? 'inverse' : ''}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }} variants={staggerReveal}><motion.p className="dh-kicker" variants={itemReveal}>{eyebrow}</motion.p><motion.h2 variants={itemReveal}>{title}</motion.h2><motion.p variants={itemReveal}>{text}</motion.p></motion.div> }
function PipelineStep({ icon: Icon, number, title, text }: { icon: LucideIcon; number: string; title: string; text: string }) { return <motion.article variants={itemReveal}><div><Icon size={19} /><span>{number}</span></div><h3>{title}</h3><p>{text}</p><motion.i animate={{ scaleX: [0, 1, 1], opacity: [0, 1, .25] }} transition={{ duration: 2.8, repeat: Infinity }} /></motion.article> }
function Integration({ icon: Icon, name, detail, tone }: { icon: LucideIcon; name: string; detail: string; tone: string }) { return <motion.article variants={itemReveal}><span className={tone}><Icon size={19} /></span><div><h3>{name}</h3><p>{detail}</p></div><b>SDK READY</b></motion.article> }
function OutputCard({ icon: Icon, value, title, text }: { icon: LucideIcon; value: string; title: string; text: string }) { return <motion.article variants={itemReveal} whileHover={{ y: -5 }}><span><Icon size={17} /></span><strong>{value}</strong><h3>{title}</h3><p>{text}</p></motion.article> }

function LegacyHomePage() {
  return (
    <Shell>
      <section className="hero">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="eyebrow">DRIFT / FRONTEND LANGUAGE</p>
          <h1>The language for<br />building <span>interfaces.</span></h1>
          <p className="hero-lede">A typed frontend language for components, styling, routing, motion, fonts, and SEO. Built for teams that want the web to feel intentional by default.</p>
          <div className="hero-actions"><Link to="/language" className="primary-action">Start with Drift <ArrowRight size={15} /></Link><a href="#stack" className="secondary-action"><Terminal size={15} /> Read the docs</a></div>
        </motion.div>
        <CompilerVisual />
      </section>

      <section className="blue-signal">
        <motion.div className="signal-field left" animate={{ x: [0, 12, 0], opacity: [.32, .65, .32] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} /><motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}><DriftLogo large /></motion.div><motion.div className="signal-field right" animate={{ x: [0, -12, 0], opacity: [.32, .65, .32] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      </section>

      <motion.section className="statement section-frame" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }} variants={sectionReveal}>
        <p className="eyebrow">BUILT AS ONE SYSTEM</p>
        <h2>Bring your product. <span>Drift builds the interface.</span><br />Your users just feel the speed.</h2>
        <p>Language infrastructure for exceptional frontend teams. One source, every surface.</p>
      </motion.section>

      <motion.section className="product-split section-frame" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }} variants={staggerReveal}>
        <motion.div className="product-column blue-tint" variants={itemReveal} whileHover={{ y: -5 }}>
          <p className="eyebrow">FOR DEVELOPERS &amp; TEAMS</p>
          <div className="product-title"><span><Code2 size={18} /></span><h3>The Drift language</h3></div>
          <p>Build production interfaces with a compact syntax that compiles into typed React, scoped CSS, and static route artifacts.</p>
          <div className="metric-row"><Metric value="<8KB" label="Typical route CSS" /><Metric value="<120ms" label="Route transition" /><Metric value="100" label="Lighthouse target" /></div>
          <Link to="/language" className="wide-action">Read the language spec <ArrowRight size={14} /></Link>
        </motion.div>
        <motion.div className="product-column warm-tint" variants={itemReveal} whileHover={{ y: -5 }}>
          <p className="eyebrow warm">FOR DESIGN SYSTEMS</p>
          <div className="product-title"><span><Palette size={18} /></span><h3>Drift UI</h3></div>
          <p>Accessible primitives, native tokens, fluid motion, and optional Tailwind compatibility without giving up Drift style.</p>
          <ul className="line-list"><li>Drift Style <span>Scoped at compile time</span></li><li>Tailwind CSS <span>Optional adapter</span></li><li>Drift Fonts <span>Google + local</span></li></ul>
          <Link to="/ui" className="wide-action dark">Explore Drift UI <ArrowRight size={14} /></Link>
        </motion.div>
      </motion.section>

      <SectionLabel label="THE DRIFT STACK" count="[ 1 / 6 ]" />
      <section className="stack-section section-frame" id="stack">
        <div className="section-heading"><h2>One language for<br />the whole frontend.</h2><p>Drift keeps components, style, routes, motion, fonts, and metadata close to the interface you are building.</p></div>
        <div className="stack-grid"><Reveal><CompilerVisual compact /></Reveal><motion.div className="stack-list" variants={staggerReveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>{features.map(([n, title, text], i) => { const Icon = featureIcons[i] || Braces; return <motion.div className={`stack-row ${i === 0 ? 'open' : ''}`} variants={itemReveal} key={title}><span className="stack-icon"><Icon size={15} /><small>{n}</small></span><div><strong>{title}</strong>{i === 0 && <p>{text}</p>}</div><b>{i === 0 ? '\u2212' : '+'}</b></motion.div> })}</motion.div></div>
      </section>

      <SectionLabel label="UNDER THE HOOD" count="[ 2 / 6 ]" />
      <section className="section-frame architecture">
        <div className="section-heading"><h2>Compiled for<br />the browser.</h2><p>Drift does the expensive thinking before the browser ever sees your app.</p></div>
        <motion.div className="architecture-grid" variants={staggerReveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}><ArchitectureCard title="Authoring graph" accent="coral" /><ArchitectureCard title="Browser output" accent="blue" /></motion.div>
        <div className="ticker">TYPED COMPONENTS / SCOPED CSS / STATIC METADATA / INSTANT ROUTES / FONT PRELOADS / ZERO RUNTIME STYLING</div>
      </section>

      <SectionLabel label="BENCHMARKS" count="[ 3 / 6 ]" />
      <section className="section-frame benchmark">
        <div className="section-heading"><h2>Fast output.<br />Clear source.</h2><p>Drift compiles the route, styles, metadata, and font strategy together so performance is structural.</p></div>
        <motion.div className="score-grid" variants={staggerReveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}><Metric value="100" label="Performance target" /><Metric value="<120ms" label="Client navigation" /><Metric value="0KB" label="Runtime styling" /></motion.div>
        <ComparisonTable />
      </section>

      <SectionLabel label="DEVELOPER EXPERIENCE" count="[ 4 / 6 ]" />
      <section className="section-frame setup">
        <div className="section-heading"><h2>Build your first<br />Drift interface.</h2><p>Create a project, write one route, and ship the static output. Tailwind is there when you need it.</p></div>
        <CodeWindow />
        <div className="chip-row">{['Drift Style', 'Tailwind', 'React', 'Vite', 'Framer Motion', 'Google Fonts', 'Static Export', 'TypeScript'].map(x => <span key={x}>{x}</span>)}</div>
      </section>

      <section className="dark-world">
        <div className="section-heading inverse"><p className="eyebrow">DRIFT COMPONENTS</p><h2>One system. Every surface.</h2><p>Production primitives that carry your design language from first route to full product.</p></div>
        <motion.div className="dark-grid" variants={staggerReveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}><DarkCard icon={Accessibility} title="Build from accessible primitives" text="Buttons, fields, navigation, dialogs, and data surfaces with carefully designed states." /><DarkCard icon={WandSparkles} title="Motion without the noise" text="Use declarative route and component motion powered by Framer Motion." /><DarkCard icon={Blocks} title="Style with real constraints" text="Tokens, responsive groups, variants, and optional Tailwind classes work together." /><DarkCard icon={Gauge} title="Ship every page ready" text="Fonts, metadata, canonical URLs, and social previews compile with the interface." /></motion.div>
        <div className="dark-stats"><Metric value="24+" label="Primitives planned" /><Metric value="AA" label="Accessibility target" /><Metric value="<8KB" label="Core styles" /></div>
      </section>

      <SectionLabel label="BUILDERS" count="[ 5 / 6 ]" />
      <section className="section-frame testimonials">
        <div className="section-heading"><h2>Frontend people get it.</h2><p>Early reactions from builders who care about the details between idea and interface.</p></div>
        <motion.div className="testimonial-grid" variants={staggerReveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>{testimonials.map(([name, handle, quote]) => <motion.article variants={itemReveal} whileHover={{ y: -6, rotate: name.length % 2 ? -0.4 : 0.4 }} key={name}><div className="person"><span>{name.slice(0, 1)}</span><div><strong>{name}</strong><small>{handle}</small></div></div><p>{quote}</p><time>Jul 2026</time></motion.article>)}</motion.div>
      </section>

      <SectionLabel label="PRICING" count="[ 6 / 6 ]" />
      <section className="section-frame pricing" id="pricing">
        <div className="section-heading"><h2>Open source. Seriously capable.</h2><p>Start free, build in public, and add team infrastructure when the product demands it.</p></div>
        <motion.div className="pricing-grid" variants={staggerReveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}><Price name="Community" price="$0" items={['Full language and compiler', 'Drift Style and Fonts', 'Static export and SEO', 'Community components']} /><Price featured name="Pro" price="$19" items={['Everything in Community', 'Complete component library', 'Premium templates', 'Priority releases']} /><Price name="Scale" price="$199" items={['Everything in Pro', 'Team design tokens', 'Private registry', 'Priority support']} /></motion.div>
      </section>

      <motion.section className="final-cta section-frame" initial="hidden" whileInView="show" viewport={{ once: true }} variants={sectionReveal}><motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}><DriftLogo large /></motion.div><h2>Your frontend deserves to <span>move with Drift.</span></h2><Link to="/language" className="primary-action">Read the docs <ArrowRight size={15} /></Link></motion.section>
      <Footer />
    </Shell>
  )
}

void LegacyHomePage

function usePageMeta(title: string, description: string, path: string) {
  React.useEffect(() => {
    document.title = title

    const setMeta = (selector: string, attribute: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector)
      if (!element) {
        element = document.createElement('meta')
        const [name, key] = attribute.split('=')
        if (name && key) element.setAttribute(name, key)
        document.head.appendChild(element)
      }
      element.setAttribute('content', value)
    }

    setMeta('meta[name="description"]', 'name=description', description)
    setMeta('meta[property="og:title"]', 'property=og:title', title)
    setMeta('meta[property="og:description"]', 'property=og:description', description)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = new URL(path, window.location.origin).href
  }, [description, path, title])
}

function ProductHero({ icon: Icon, kicker, title, accent, text, children }: { icon: LucideIcon; kicker: string; title: string; accent: string; text: string; children?: React.ReactNode }) {
  const path = kicker === 'DRIFT LANGUAGE' ? '/language' : kicker === 'DRIFT UI' ? '/ui' : '/seo'
  const pageName = path === '/language' ? 'Drift Language' : path === '/ui' ? 'Drift UI' : 'Drift SEO'
  usePageMeta(`${pageName} - ${title} ${accent}`, text, path)
  return <section className="pp-hero"><motion.div className="pp-hero-copy" initial="hidden" animate="show" variants={staggerReveal}><motion.p className="pp-kicker" variants={itemReveal}><Icon size={13} />{kicker}</motion.p><motion.h1 variants={itemReveal}>{title} <span>{accent}</span></motion.h1><motion.p variants={itemReveal}>{text}</motion.p><motion.div className="dh-actions" variants={itemReveal}>{children}</motion.div></motion.div><motion.div className="pp-hero-symbol" initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7 }}><motion.i animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} /><motion.i animate={{ rotate: -360 }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }} /><span><Icon size={32} /></span></motion.div></section>
}

function PageIntro({ kicker, title, text }: { kicker: string; title: string; text: string }) { return <motion.div className="pp-intro" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }} variants={staggerReveal}><motion.p className="pp-kicker" variants={itemReveal}>{kicker}</motion.p><motion.h2 variants={itemReveal}>{title}</motion.h2><motion.p variants={itemReveal}>{text}</motion.p></motion.div> }

function LanguagePage() {
  return <Shell><main className="product-page language-page"><ProductHero icon={Code2} kicker="DRIFT LANGUAGE" title="The interface is" accent="the source." text="A typed grammar for components, style, routes, motion, fonts, metadata, and the React ecosystem."><a className="dh-primary" href="#syntax">Explore syntax <ArrowRight size={14} /></a><a className="dh-secondary" href="#routing"><RouteIcon size={14} /> Routing model</a></ProductHero><section className="pp-section" id="syntax"><PageIntro kicker="SOURCE TO OUTPUT" title="One file. Every frontend concern." text="Drift keeps the parts of an interface together, then emits familiar artifacts you can inspect, test, and deploy." /><div className="language-workbench"><div className="lw-files"><span>PROJECT</span>{['app/', 'routes/', 'index.drift', 'components/', 'Button.drift'].map((file, i) => <div className={i === 2 ? 'active' : ''} style={{ paddingLeft: `${12 + (i === 2 ? 22 : i % 2 ? 12 : 0)}px` }} key={file}>{i === 2 ? <FileCode2 size={13} /> : <ChevronRight size={11} />}{file}</div>)}</div><div className="lw-code"><div className="lw-tabs"><b>index.drift</b><span>Button.drift</span></div><pre><code><em>import</em> {'{ Button }'} <em>from</em> <strong>"@/ui/button"</strong>{'\n\n'}<em>page</em> Product {'{\n'}  metadata {'{\n'}    title: <strong>"Acme / Products"</strong>{'\n'}    canonical: <strong>"/products"</strong>{'\n'}  {'}\n\n'}  style {'{\n'}    display: grid{'\n'}    responsive(md) {'{'} columns: 3 {'}\n'}  {'}\n\n'}  motion {'{\n'}    enter: fade-up 240ms{'\n'}  {'}\n}'}</code></pre></div><div className="lw-output"><span>COMPILED OUTPUT</span>{[['TSX', 'typed component'], ['CSS', 'scoped layer'], ['HEAD', 'static metadata'], ['ROUTE', 'prefetch manifest']].map(([name, detail], i) => <motion.div key={name} animate={{ opacity: [.55, 1, .55] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * .35 }}><CircleCheck size={14} /><b>{name}</b><small>{detail}</small></motion.div>)}</div></div></section><section className="pp-dark" id="routing"><div className="pp-section"><PageIntro kicker="FILE ROUTING" title="Routes that behave like product infrastructure." text="Static, dynamic, catch-all, grouped, and nested layouts with URL-first navigation and browser-native history." /><div className="route-model"><div className="route-tree">{[['routes/index.drift','/'],['routes/docs/[slug].drift','/docs/:slug'],['routes/blog/[...post].drift','/blog/*'],['routes/(app)/settings.drift','/settings']].map(([file,path],i)=><motion.div key={file} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i*.1 }}><FileCode2 size={14}/><span>{file}</span><b>{path}</b></motion.div>)}</div><div className="route-lifecycle"><span><MouseRouteIcon /><small>LINK INTENT</small></span><motion.i animate={{ scaleX:[0,1,1],opacity:[0,1,.35] }} transition={{duration:2.4,repeat:Infinity}}/><span><Workflow size={18}/><small>PREFETCH</small></span><motion.i animate={{ scaleX:[0,1,1],opacity:[0,1,.35] }} transition={{duration:2.4,repeat:Infinity,delay:.7}}/><span><Zap size={18}/><small>COMMIT</small></span></div></div></div></section><FeatureBand items={[[Type,'Typed props'],[Palette,'Scoped style'],[RouteIcon,'URL-first routes'],[Sparkles,'Motion grammar'],[Globe2,'Static metadata']]} /><Footer /></main></Shell>
}

function SEOPage() {
  return <Shell><main className="product-page seo-page"><ProductHero icon={Search} kicker="SEARCH / SOCIAL / DISCOVERY" title="SEO that ships with" accent="the route." text="Metadata is typed source code, not a launch checklist. Drift emits canonical, social, robots, sitemap, and structured output during the build."><a className="dh-primary" href="#inspector">Inspect output <ArrowRight size={14} /></a><Link className="dh-secondary" to="/language"><Code2 size={14}/> View syntax</Link></ProductHero><section className="pp-section" id="inspector"><PageIntro kicker="OUTPUT INSPECTOR" title="See what crawlers receive." text="One metadata block becomes every discovery surface while keeping route ownership explicit." /><div className="seo-inspector"><div className="seo-source"><div className="lw-tabs"><b>metadata</b><span>generated head</span></div><pre><code>metadata {'{\n'}  title: <em>"Drift UI"</em>{'\n'}  description: <em>"Components that ship."</em>{'\n'}  canonical: <em>"/ui"</em>{'\n'}  robots: <em>"index,follow"</em>{'\n'}  og.title: <em>"Build with Drift"</em>{'\n'}  og.image: <em>"/drift-ui.png"</em>{'\n'}  twitter.card: <em>"summary_large_image"</em>{'\n}'}</code></pre></div><div className="seo-previews"><motion.div className="search-preview" whileHover={{ y: -4 }}><small>drift.dev / ui</small><strong>Drift UI - Components that ship</strong><p>Accessible primitives, compiled styles, motion, fonts, and metadata in one frontend system.</p></motion.div><motion.div className="social-preview" whileHover={{ y: -4 }}><div><DriftLogo large /></div><span><small>drift.dev</small><strong>Build with Drift</strong><p>The frontend language for the whole web.</p></span></motion.div></div></div></section><section className="seo-output-band"><div className="pp-section"><PageIntro kicker="BUILD ARTIFACTS" title="Discovery infrastructure, generated." text="The compiler owns deterministic search output, so deployments do not depend on runtime rendering or forgotten plugins." /><div className="seo-artifacts"><Artifact icon={Globe2} name="canonical + hreflang" format="HTML HEAD"/><Artifact icon={Search} name="Open Graph + Twitter" format="META"/><Artifact icon={Workflow} name="sitemap.xml" format="XML"/><Artifact icon={LockKeyhole} name="robots.txt" format="TXT"/></div><ComparisonTable /></div></section><FeatureBand items={[[Gauge,'Static output'],[Globe2,'Canonical URLs'],[Search,'Social previews'],[Workflow,'Sitemaps'],[LockKeyhole,'Robots policy']]} /><Footer /></main></Shell>
}

function UIPage() {
  return <Shell><main className="product-page ui-page"><ProductHero icon={Component} kicker="DRIFT UI" title="A component system with" accent="an escape hatch." text="Start with accessible Drift primitives. Bring shadcn/ui, Radix, Hugeicons, Lucide, or Tailwind whenever the product needs them."><a className="dh-primary" href="#playground">Open playground <ArrowRight size={14}/></a><Link className="dh-secondary" to="/language"><Code2 size={14}/> Component syntax</Link></ProductHero><section className="pp-section" id="playground"><PageIntro kicker="LIVE SURFACE" title="Components should feel finished." text="States, hierarchy, motion, responsive behavior, and accessible interaction are part of each primitive, not follow-up work." /><div className="ui-playground"><aside><span>COMPONENTS</span>{[[Blocks,'Button'],[Search,'Command'],[Component,'Dialog'],[Palette,'Theme'],[Accessibility,'Accessibility']].map(([Icon,name],i)=><button className={i===0?'active':''} key={name as string}><Icon size={14}/>{name as string}<ChevronRight size={12}/></button>)}</aside><div className="ui-canvas"><div className="ui-toolbar"><span>Button / Primary</span><div><button>Default</button><button>Hover</button><button>Pressed</button></div></div><div className="ui-demo"><motion.button whileHover={{y:-3}} whileTap={{scale:.97}}>Create project <ArrowRight size={14}/></motion.button><button className="outline"><Github size={14}/> Import repository</button><span><i/>Focus visible</span></div><div className="ui-props"><span>SIZE <b>MD</b></span><span>RADIUS <b>6</b></span><span>MOTION <b>SPRING</b></span><span>ICON <b>RIGHT</b></span></div></div></div></section><section className="pp-dark ui-interop"><div className="pp-section"><PageIntro kicker="REACT ECOSYSTEM" title="Use what already works." text="Drift preserves normal ESM component imports and aliases, so existing libraries remain tree-shakeable and portable." /><div className="interop-code"><pre><code><em>import</em> {'{ Button }'} <em>from</em> <strong>"@/components/ui/button"</strong>{'\n'}<em>import</em> {'{ HugeiconsIcon }'} <em>from</em> <strong>"@hugeicons/react"</strong>{'\n'}<em>import</em> {'{ SearchIcon }'} <em>from</em> <strong>"@hugeicons/core-free-icons"</strong>{'\n\n'}component SearchAction {'{\n'}  render {'{\n'}    {'<Button tw="h-9 px-3">\n'}      {'<HugeiconsIcon icon={SearchIcon} />\n'}    {'</Button>\n'}  {'}\n}'}</code></pre><div>{['shadcn/ui','Radix UI','Hugeicons','Lucide','Tailwind CSS'].map((name,i)=><motion.span key={name} animate={{x:[0,4,0]}} transition={{duration:2.8,repeat:Infinity,delay:i*.25}}><CircleCheck size={14}/>{name}<small>COMPATIBLE</small></motion.span>)}</div></div></div></section><FeatureBand items={[[Accessibility,'Accessible'],[Palette,'Token driven'],[Sparkles,'Motion ready'],[Blocks,'Composable'],[Gauge,'Tree-shakeable']]} /><Footer /></main></Shell>
}

function NotFoundPage() { usePageMeta('404 - Route not found | Drift', 'The requested route is not in the current Drift route manifest.', typeof window === 'undefined' ? '/404' : window.location.pathname); return <Shell><main className="not-found"><motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}><DriftLogo large/><p>404 / ROUTE_NOT_FOUND</p><h1>This route drifted away.</h1><span>The URL is valid. The page is not in the current route manifest.</span><Link className="dh-primary" to="/">Return home <ArrowRight size={15}/></Link></motion.div></main><Footer /></Shell> }

function FeatureBand({ items }: { items: Array<[LucideIcon, string]> }) { return <div className="feature-band">{items.map(([Icon,label])=><span key={label}><Icon size={15}/>{label}</span>)}</div> }
function Artifact({ icon: Icon, name, format }: { icon: LucideIcon; name: string; format: string }) { return <motion.article whileHover={{y:-5}}><Icon size={18}/><strong>{name}</strong><span>{format}</span><CircleCheck size={14}/></motion.article> }
function MouseRouteIcon() { return <RouteIcon size={18}/> }

function DriftLogo({ large = false }: { large?: boolean }) { return <span className={`brand-mark ${large ? 'large' : ''}`} aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path className="drift-ring" d="M11 5h6.5C23.3 5 27 9.2 27 16s-3.7 11-9.5 11H11V5Z"/><path className="drift-stem" d="M11 10v12h6.1c2.9 0 4.9-2.1 4.9-6s-2-6-4.9-6H11Z"/><path className="drift-wake" d="M3 10h8M1.5 16H11M3 22h8"/></svg></span> }
function Reveal({ children }: { children: React.ReactNode }) { return <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={sectionReveal}>{children}</motion.div> }
function Metric({ value, label }: { value: string; label: string }) { return <div className="metric"><strong>{value}</strong><span>{label}</span></div> }
function SectionLabel({ label, count }: { label: string; count: string }) { return <div className="section-label section-frame"><span>{label}</span><b>{count}</b></div> }

function CompilerVisual({ compact = false }: { compact?: boolean }) {
  return <motion.div className={`compiler-visual ${compact ? 'compact' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1, duration: .55 }}>
    <div className="visual-label">DRIFT COMPILER</div>
    <motion.div className="layer layer-one" animate={{ y: [0, -7, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}><DriftLogo /><span>SOURCE</span></motion.div>
    <div className="flow-dots"><i /><i /><i /></div>
    <motion.div className="layer layer-two" animate={{ y: [0, 6, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: .2 }}><span>ROUTES</span><span>STYLES</span><span>SEO</span></motion.div>
    <motion.div className="flow-lines" animate={{ scaleY: [1, .7, 1], opacity: [.45, 1, .45] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.div className="layer layer-three" animate={{ y: [0, -4, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: .4 }}><strong>WEB OUTPUT</strong></motion.div>
  </motion.div>
}

function ArchitectureCard({ title, accent }: { title: string; accent: string }) {
  const Icon = accent === 'blue' ? Gauge : Layers3
  return <motion.div className={`architecture-card ${accent}`} variants={itemReveal} whileHover={{ y: -8, rotateX: 2 }}><span className="architecture-title"><Icon size={16} />{title}</span><div className="nodes"><motion.i animate={{ y: [0, -8, 0], x: [0, 3, 0] }} transition={{ duration: 3.2, repeat: Infinity, delay: .05 }} /><motion.i animate={{ y: [0, 6, 0] }} transition={{ duration: 2.7, repeat: Infinity, delay: .18 }} /><motion.i animate={{ y: [0, -5, 0], x: [0, -4, 0] }} transition={{ duration: 3.6, repeat: Infinity, delay: .3 }} /><motion.i animate={{ y: [0, 7, 0] }} transition={{ duration: 3, repeat: Infinity, delay: .42 }} /><motion.i animate={{ y: [0, -6, 0] }} transition={{ duration: 3.4, repeat: Infinity, delay: .55 }} /><motion.i animate={{ y: [0, 5, 0], x: [0, 3, 0] }} transition={{ duration: 2.8, repeat: Infinity, delay: .7 }} /></div></motion.div>
}

function ComparisonTable() {
  return <div className="comparison-table"><div><b>Capability</b><b>Drift</b><b>Traditional stack</b></div>{[['Component language','Partial'],['Scoped styling','Add-on'],['Font optimization','Framework API'],['Route metadata','Manual'],['Static SEO files','Plugin'],['Tailwind compatibility','Supported']].map(row => <div key={row[0]}><span>{row[0]}</span><strong role="img" aria-label="Included"><Check size={14} /></strong><span>{row[1]}</span></div>)}</div>
}

function CodeWindow() {
  return <motion.div className="code-window" whileHover={{ y: -3 }}><div className="code-tabs"><b>Drift</b><span>Compiled output</span><span>Metadata</span></div><pre><code><span>component</span> LandingPage {'{\n'}  metadata {'{\n'}    title: <em>"Drift - frontend at speed"</em>{'\n'}    canonical: <em>"/"</em>{'\n'}  {'}\n\n'}  style {'{\n'}    layout: column center{'\n'}    font: $font.manrope{'\n'}    responsive(md) {'{'} px: $space.8 {'}\n'}  {'}\n\n'}  render {'{\n'}    {'<main><Hero /><Features /></main>\n'}  {'}\n}'}</code></pre></motion.div>
}

function DarkCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) { return <motion.article variants={itemReveal} whileHover={{ y: -8 }}><div className="dark-card-visual"><motion.div className="dark-orbit orbit-one" animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} /><motion.div className="dark-orbit orbit-two" animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} /><motion.span className="dark-icon" animate={{ y: [0, -7, 0], rotate: [0, -3, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}><Icon size={28} /></motion.span></div><h3>{title}</h3><p>{text}</p></motion.article> }
function Price({ name, price, items, featured = false }: { name: string; price: string; items: string[]; featured?: boolean }) { return <motion.article variants={itemReveal} className={featured ? 'featured' : ''} whileHover={{ y: -8 }}><p className="eyebrow">{name}</p><h3>{price}<small>{price !== '$0' ? '/mo.' : ''}</small></h3><ul>{items.map(x => <li key={x}><Check size={13} />{x}</li>)}</ul><button>{featured ? 'Get Drift Pro' : `Choose ${name}`} <ArrowRight size={14} /></button></motion.article> }
function Footer() { return <footer><Link className="brand" to="/"><DriftLogo /><span>drift</span></Link><div><span>PRODUCT</span><Link to="/language">Language</Link><Link to="/ui">Components</Link><Link to="/seo">SEO</Link></div><div><span>RESOURCES</span><a href="#">Documentation</a><a href="#">Examples</a><a href="#">Changelog</a></div><div><span>COMPANY</span><a href="#">About</a><a href="#">GitHub</a><a href="#">Contact</a></div></footer> }
