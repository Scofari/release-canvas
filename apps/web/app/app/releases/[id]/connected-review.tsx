'use client';
import Link from 'next/link';
import {
  type FormEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createClient } from '@/lib/supabase/client';

type Version = {
  id: string;
  version: number;
  storage_path: string;
  width: number;
  height: number;
};
type Artifact = { id: string; name: string; artifact_versions: Version[] };
type Check = {
  id: string;
  label: string;
  completed_at: string | null;
  position: number;
};
type Release = {
  id: string;
  workspace_id: string;
  name: string;
  status: 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'archived';
  version: number;
  artifacts: Artifact[];
  checklist_items: Check[];
};
type Note = {
  id: string;
  x: number;
  y: number;
  title: string;
  body: string;
  status: 'open' | 'resolved';
  version: number;
};
const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
export function ConnectedReview({ releaseId }: { releaseId: string }) {
  const [release, setRelease] = useState<Release | null>(null),
    [notes, setNotes] = useState<Note[]>([]),
    [asset, setAsset] = useState<string | null>(null),
    [point, setPoint] = useState<{ x: number; y: number } | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const { data } = await supabase.auth.getSession();
      const response = await fetch(`${api}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
          ...init?.headers,
        },
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail ?? body.message ?? 'Request failed');
      return body;
    },
    [supabase],
  );
  const refresh = useCallback(async () => {
    try {
      const item: Release = await request(`/releases/${releaseId}`);
      setRelease(item);
      const version = item.artifacts
        .flatMap((a) => a.artifact_versions)
        .sort((a, b) => b.version - a.version)[0];
      if (version) {
        const { data } = await supabase.storage
          .from('release-artifacts')
          .createSignedUrl(version.storage_path, 300);
        setAsset(data?.signedUrl ?? null);
        setNotes(await request(`/annotations?artifactVersionId=${version.id}`));
      } else {
        setAsset(null);
        setNotes([]);
      }
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : 'Unable to load release',
      );
    }
  }, [releaseId, request, supabase]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  function choosePoint(event: MouseEvent<HTMLDivElement>) {
    if (!asset) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPoint({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    });
  }
  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!release || !point) return;
    const version = release.artifacts.flatMap((a) => a.artifact_versions)[0];
    const form = new FormData(event.currentTarget);
    await request('/annotations', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: release.workspace_id,
        artifactVersionId: version.id,
        x: point.x,
        y: point.y,
        title: form.get('title'),
        body: form.get('body'),
        assigneeName: null,
      }),
    });
    setPoint(null);
    await refresh();
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!release) return;
    const file = new FormData(event.currentTarget).get('file') as File;
    if (!file?.size) return;
    setBusy(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const started = await request('/artifacts/uploads', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: release.workspace_id,
          releaseId: release.id,
          name: file.name,
          fileName: safeName,
          mimeType: file.type,
          byteSize: file.size,
        }),
      });
      const image = await createImageBitmap(file);
      const { error } = await supabase.storage
        .from('release-artifacts')
        .uploadToSignedUrl(started.path, started.token, file, {
          contentType: file.type,
        });
      if (error) throw error;
      await request('/artifacts/uploads/complete', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: release.workspace_id,
          artifactId: started.artifactId,
          path: started.path,
          mimeType: file.type,
          byteSize: file.size,
          width: image.width,
          height: image.height,
        }),
      });
      setMessage('Screenshot uploaded securely');
      await refresh();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }
  async function addCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!release) return;
    const form = new FormData(event.currentTarget);
    await request('/checklists', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: release.workspace_id,
        releaseId: release.id,
        label: form.get('label'),
        position: release.checklist_items.length,
      }),
    });
    event.currentTarget.reset();
    await refresh();
  }
  async function toggleCheck(item: Check) {
    await request(`/checklists/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !item.completed_at }),
    });
    await refresh();
  }
  async function toggleNote(note: Note) {
    await request(`/annotations/${note.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: note.status === 'open' ? 'resolved' : 'open',
        version: note.version,
      }),
    });
    await refresh();
  }
  async function transition(status: Release['status']) {
    if (!release) return;
    try {
      await request(`/releases/${release.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, version: release.version }),
      });
      await refresh();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : 'Transition failed',
      );
    }
  }
  async function share() {
    if (!release) return;
    const link = await request('/share-links', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: release.workspace_id,
        releaseId: release.id,
      }),
    });
    await navigator.clipboard.writeText(
      `${location.origin}/review/${link.token}`,
    );
    setMessage(
      `Guest link copied · expires ${new Date(link.expires_at).toLocaleDateString()}`,
    );
  }
  if (!release)
    return (
      <main className="workspace-loading">
        {message || 'Loading release review…'}
      </main>
    );
  const open = notes.filter((n) => n.status === 'open').length;
  return (
    <main className="connected-shell">
      <header>
        <Link className="brand" href="/app">
          <span>R</span> ReleaseCanvas
        </Link>
        <div>
          <span className="status">● {release.status.replace('_', ' ')}</span>
          <button className="button ghost" onClick={share}>
            Share review
          </button>
          {release.status === 'draft' && (
            <button
              className="button primary"
              onClick={() => transition('in_review')}
            >
              Start review
            </button>
          )}
          {release.status === 'in_review' && (
            <button
              className="button primary"
              onClick={() => transition('approved')}
            >
              Approve
            </button>
          )}
        </div>
      </header>
      <section className="connected-heading">
        <div>
          <div className="eyebrow">
            <i /> Connected release · v{release.version}
          </div>
          <h1>{release.name}</h1>
          <p>
            {open} open annotations ·{' '}
            {release.checklist_items.filter((i) => i.completed_at).length}/
            {release.checklist_items.length} checks complete
          </p>
        </div>
        <Link href="/app">← Workspace overview</Link>
      </section>
      <div className="connected-grid">
        <section>
          <div className="connected-toolbar">
            <form onSubmit={upload}>
              <input
                aria-label="Upload screenshot"
                name="file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required
              />
              <button className="button primary" disabled={busy}>
                {busy ? 'Uploading…' : 'Upload screenshot'}
              </button>
            </form>
            <span>Click screenshot to place feedback</span>
          </div>
          <div className="connected-stage" onClick={choosePoint}>
            {asset ? (
              <img src={asset} alt="Current interface version" />
            ) : (
              <div className="empty-artifact">
                Upload the first release screenshot.
              </div>
            )}
            {notes.map((note, index) => (
              <button
                key={note.id}
                className={`annotation-pin ${note.status === 'resolved' ? 'resolved' : ''}`}
                style={{
                  left: `${Number(note.x) * 100}%`,
                  top: `${Number(note.y) * 100}%`,
                }}
                title={note.title}
              >
                {index + 1}
              </button>
            ))}
            {point && (
              <span
                className="annotation-pin selected"
                style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
              >
                +
              </span>
            )}
          </div>
        </section>
        <aside>
          <div className="connected-tabs">
            <h2>Review details</h2>
            <span>{notes.length}</span>
          </div>
          {point && (
            <form className="annotation-form" onSubmit={addNote}>
              <strong>New annotation</strong>
              <input name="title" required placeholder="Actionable title" />
              <textarea
                name="body"
                required
                rows={3}
                placeholder="What should change, and why?"
              />
              <button className="button primary">Add feedback</button>
            </form>
          )}
          <div className="connected-notes">
            {notes.map((note, index) => (
              <article key={note.id}>
                <b>{index + 1}</b>
                <div>
                  <strong>{note.title}</strong>
                  <p>{note.body}</p>
                  <button
                    className="note-status-button"
                    onClick={() => toggleNote(note)}
                  >
                    {note.status === 'open' ? 'Mark resolved' : 'Reopen'}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="check-panel">
            <h2>Release checklist</h2>
            {release.checklist_items.map((item) => (
              <button key={item.id} onClick={() => toggleCheck(item)}>
                <span>{item.completed_at ? '✓' : '○'}</span>
                {item.label}
              </button>
            ))}
            <form onSubmit={addCheck}>
              <input name="label" required placeholder="Add required check" />
              <button aria-label="Add check">+</button>
            </form>
          </div>
          <p className="connected-message" role="status">
            {message}
          </p>
        </aside>
      </div>
    </main>
  );
}
