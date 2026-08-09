'use client';
import Link from 'next/link';
import { useState } from 'react';
import { canApproveRelease } from './review-policy';

const initialNotes = [
  { id: 1, x: 29, y: 66, title: 'Increase CTA contrast', body: 'The label loses contrast against the warm surface at smaller sizes.', author: 'Elena', time: '8m', resolved: false },
  { id: 2, x: 73, y: 43, title: 'Protect the product crop', body: 'Keep the lamp inside the safe area on tablet breakpoints.', author: 'Marcus', time: '14m', resolved: false },
  { id: 3, x: 59, y: 78, title: 'Confirm legal copy', body: 'Use the approved shipping statement before launch.', author: 'Ana', time: '31m', resolved: false },
];

export function ReviewWorkspace() {
  const [notes, setNotes] = useState(initialNotes);
  const [selected, setSelected] = useState(1);
  const [approved, setApproved] = useState(false);
  const [toast, setToast] = useState('');
  const active = notes.find((note) => note.id === selected);
  const open = notes.filter((note) => !note.resolved).length;
  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2600); }
  function toggleResolved(id: number) { setNotes((current) => current.map((note) => note.id === id ? { ...note, resolved: !note.resolved } : note)); notify('Annotation status updated'); }
  function approve() { if (!canApproveRelease(notes)) { notify(`${open} open annotations must be resolved first`); return; } setApproved(true); notify('Approval recorded in the activity history'); }

  return <main className="app-shell">
    <header className="app-topbar">
      <Link className="brand" href="/"><span>R</span> ReleaseCanvas</Link>
      <div className="crumbs">Northstar Studio <b>/</b> Meridian commerce <b>/</b> Checkout refinement</div>
      <div className="avatar-group"><i>ES</i><i>MK</i><i>VS</i><button aria-label="Invite team member">+</button></div>
    </header>
    <aside className="app-sidebar">
      <nav aria-label="Workspace"><Link className="side-active" href="/demo">Review</Link><a href="#annotations">Annotations <b>{open}</b></a><a href="#checklist">Checklist <b>8/11</b></a><a href="#activity">Activity</a></nav>
      <div className="usage"><small>FREE EARLY ACCESS</small><strong>2 of 3 releases</strong><div className="progress"><i style={{width:'67%'}}/></div><span>186 MB of 500 MB</span></div>
    </aside>
    <section className="review-main">
      <div className="review-header"><div><div className="eyebrow"><i/> Release candidate 02</div><h1>Checkout refinement</h1><p>Updated responsive checkout and trust messaging · Version 4</p></div><div className="review-actions"><span className={approved ? 'status approved' : 'status'}>{approved ? '● Approved' : '● In review'}</span><button className="button ghost" onClick={()=>notify('Secure guest link copied')}>Share review</button><button className="button primary" onClick={approve}>Approve release</button></div></div>
      <div className="review-grid">
        <div className="canvas-column">
          <div className="canvas-toolbar"><div><button className="tool-active">Desktop</button><button>Tablet</button><button>Mobile</button></div><span>1440 × 1024 · 100%</span><div><button aria-label="Zoom out">−</button><button aria-label="Zoom in">+</button></div></div>
          <div className="canvas-stage"><div className="demo-browser">
            <div className="mock-top"><i/><i/><i/><span>meridian.shop/checkout</span></div>
            <div className="checkout"><div className="checkout-nav"><b>MERIDIAN</b><span>Secure checkout</span></div><div className="checkout-body"><section><small>STEP 2 OF 3</small><h2>Delivery details</h2><label>Email address<input value="alex@northstar.studio" readOnly/></label><div className="input-row"><label>First name<input value="Alex" readOnly/></label><label>Last name<input value="Morgan" readOnly/></label></div><label>Address<input value="47 Mercer Street" readOnly/></label><button>Continue to payment</button></section><aside><small>YOUR ORDER</small><div className="product-thumb"/><div><strong>Arc table lamp</strong><span>Warm brass · EU</span></div><hr/><p><span>Subtotal</span><b>€289</b></p><p><span>Delivery</span><b>Free</b></p><hr/><p><strong>Total</strong><strong>€289</strong></p></aside></div></div>
            {notes.map((note)=><button key={note.id} aria-label={`Annotation ${note.id}: ${note.title}`} aria-pressed={selected===note.id} className={`annotation-pin ${selected===note.id?'selected':''} ${note.resolved?'resolved':''}`} style={{left:`${note.x}%`,top:`${note.y}%`}} onClick={()=>setSelected(note.id)}>{note.resolved?'✓':note.id}</button>)}
          </div></div>
        </div>
        <aside id="annotations" className="annotation-panel">
          <header><div><h2>Annotations</h2><span>{open} open · {notes.length-open} resolved</span></div><button aria-label="Filter annotations">⌁</button></header>
          <div className="annotation-tabs"><button className="active">Open</button><button>Resolved</button><button>All</button></div>
          <div className="note-list">{notes.map(note=><button key={note.id} className={selected===note.id?'note selected-note':'note'} onClick={()=>setSelected(note.id)}><b>{note.resolved?'✓':note.id}</b><span><strong>{note.title}</strong><small>{note.author} · {note.time}</small></span></button>)}</div>
          {active&&<article className="note-detail"><div><span className="note-number">{active.id}</span><small>{active.resolved?'RESOLVED':'OPEN FEEDBACK'}</small></div><h3>{active.title}</h3><p>{active.body}</p><div className="author"><i>{active.author.slice(0,2).toUpperCase()}</i><span><b>{active.author}</b><small>Product designer</small></span></div><button className="resolve-button" onClick={()=>toggleResolved(active.id)}>{active.resolved?'Reopen annotation':'✓ Mark as resolved'}</button></article>}
          <div className="demo-note">Interactive portfolio demo · changes stay on this device</div>
        </aside>
      </div>
    </section>
    <div className="live-region" role="status" aria-live="polite">{toast}</div>
  </main>;
}
