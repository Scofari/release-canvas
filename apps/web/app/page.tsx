import Link from 'next/link';

export default function Home() {
  return <main className="marketing-shell">
    <nav className="marketing-nav" aria-label="Primary navigation">
      <Link className="brand" href="/"><span>R</span> ReleaseCanvas</Link>
      <div><Link href="#workflow">Workflow</Link><Link href="#pricing">Pricing</Link><Link className="nav-cta" href="/demo">Open live demo</Link></div>
    </nav>
    <section className="hero">
      <div className="eyebrow"><i /> Release confidence, captured</div>
      <h1>Review the interface.<br/><em>Remember the decision.</em></h1>
      <p>ReleaseCanvas brings screenshots, precise feedback, QA checks, and approval evidence into one focused workspace.</p>
      <div className="hero-actions"><Link className="button primary" href="/demo">Explore the recruiter demo <span>↗</span></Link><a className="button ghost" href="#workflow">See the workflow</a></div>
      <div className="trust-row"><span>No credit card</span><span>Private by default</span><span>Accessible review tools</span></div>
    </section>
    <section className="product-frame" aria-label="ReleaseCanvas product preview">
      <div className="frame-bar"><div><b>ReleaseCanvas</b><span>/ Northstar Studio / Meridian</span></div><span className="status-pill">● In review</span></div>
      <div className="frame-body"><aside><span className="active-line">Overview</span><span>Artifacts</span><span>Checklist</span><span>Activity</span><small>RELEASE HEALTH</small><strong>8 / 11</strong><div className="progress"><i /></div></aside><div className="preview-canvas"><div className="mock-browser"><div className="mock-top"><i/><i/><i/></div><div className="mock-page"><div className="mock-copy"><small>MERIDIAN / SS26</small><h2>Objects for<br/>intentional living.</h2><p>Quiet forms. Honest materials.<br/>Made to stay.</p><button>Explore collection</button></div><div className="mock-object"/><span className="pin one">1</span><span className="pin two">2</span><span className="pin three">3</span></div></div></div><div className="preview-comments"><small>OPEN FEEDBACK · 3</small><article><b>1</b><div><strong>Increase CTA contrast</strong><p>Fails against the warm background at smaller sizes.</p><span>Elena · 8m</span></div></article><article><b>2</b><div><strong>Align product crop</strong><p>Keep the object inside the safe area.</p><span>Marcus · 14m</span></div></article></div></div>
    </section>
    <section id="workflow" className="workflow"><header><div className="eyebrow"><i/> One deliberate flow</div><h2>From “almost ready”<br/>to <em>approved.</em></h2></header><div className="steps">{[['01','Capture','Upload responsive screens and preserve every version.'],['02','Resolve','Pin actionable feedback, assign owners, close the loop.'],['03','Decide','Record approval or requested changes in an audit trail.']].map(([n,t,d])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div></section>
    <section id="pricing" className="pricing"><div><div className="eyebrow"><i/> Early access</div><h2>Start with the work.<br/><em>Pay when it sticks.</em></h2></div><article><span>FREE</span><h3>$0 <small>/ month</small></h3><ul><li>1 workspace</li><li>3 team members</li><li>3 active releases</li><li>500 MB private storage</li></ul><Link className="button primary" href="/demo">Try the demo</Link></article><article className="pro"><span>PRO · COMING SOON</span><h3>$24 <small>/ month</small></h3><ul><li>Unlimited active releases</li><li>Evidence report exports</li><li>Guest branding controls</li><li>Priority support</li></ul><button className="button ghost" disabled>Join the waitlist</button></article></section>
    <footer><Link className="brand" href="/"><span>R</span> ReleaseCanvas</Link><p>Built by Vladimir Scofari as a production-minded full-stack product.</p><span>© 2026</span></footer>
  </main>;
}
