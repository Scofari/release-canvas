'use client';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Workspace = { id: string; name: string; slug: string; plan: string };
type Project = {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
};
type Release = {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  status: string;
  version: number;
};
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
export function WorkspaceApp({ userEmail }: { userEmail: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]),
    [projects, setProjects] = useState<Project[]>([]),
    [releases, setReleases] = useState<Release[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const token = useCallback(async () => {
    const { data } = await createClient().auth.getSession();
    return data.session?.access_token ?? '';
  }, []);
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const access = await token();
      const response = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access}`,
          ...init?.headers,
        },
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail ?? body.message ?? 'Request failed');
      return body;
    },
    [token],
  );
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [w, p, r] = await Promise.all([
        request('/workspaces'),
        request('/projects'),
        request('/releases'),
      ]);
      setWorkspaces(w);
      setProjects(p);
      setReleases(r);
      setError('');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to load workspace',
      );
    } finally {
      setLoading(false);
    }
  }, [request]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function onboard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await request('/workspaces/onboard', {
      method: 'POST',
      body: JSON.stringify({
        workspaceName: form.get('name'),
        workspaceSlug: form.get('slug'),
        displayName: form.get('displayName'),
      }),
    });
    await refresh();
  }
  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: workspaces[0]?.id,
        name: form.get('name'),
        description: form.get('description'),
      }),
    });
    event.currentTarget.reset();
    await refresh();
  }
  async function createRelease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const created = await request('/releases', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: workspaces[0]?.id,
        projectId: form.get('projectId'),
        name: form.get('name'),
        dueAt: null,
      }),
    });
    location.href = `/app/releases/${created.id}`;
  }
  async function signOut() {
    await createClient().auth.signOut();
    location.href = '/';
  }
  if (loading)
    return (
      <main className="workspace-loading">
        Preparing your release workspace…
      </main>
    );
  if (!workspaces.length)
    return (
      <main className="onboard-shell">
        <Link className="brand" href="/">
          <span>R</span> ReleaseCanvas
        </Link>
        <form onSubmit={onboard}>
          <div className="eyebrow">
            <i /> First workspace
          </div>
          <h1>Set up your review room.</h1>
          <p>Create a private workspace for your team’s release evidence.</p>
          <label>
            Your name
            <input
              name="displayName"
              required
              defaultValue={userEmail.split('@')[0]}
            />
          </label>
          <label>
            Workspace name
            <input name="name" required placeholder="Northstar Studio" />
          </label>
          <label>
            Workspace URL
            <input
              name="slug"
              required
              pattern="[a-z0-9-]{2,50}"
              placeholder="northstar-studio"
            />
          </label>
          <button className="button primary">Create workspace</button>
          <p role="alert">{error}</p>
        </form>
      </main>
    );
  const workspace = workspaces[0]!;
  return (
    <main className="workspace-shell">
      <header>
        <Link className="brand" href="/">
          <span>R</span> ReleaseCanvas
        </Link>
        <div>
          <span>{workspace.name}</span>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>
      <aside>
        <nav>
          <a className="active" href="#overview">
            Overview
          </a>
          <a href="#projects">Projects</a>
          <a href="#releases">Releases</a>
          <Link href="/demo">Review demo</Link>
        </nav>
        <div>
          <small>FREE PLAN</small>
          <p>
            {releases.filter((r) => r.status !== 'archived').length} / 3 active
            releases
          </p>
        </div>
      </aside>
      <section>
        <div className="workspace-heading">
          <div>
            <div className="eyebrow">
              <i /> Live workspace
            </div>
            <h1>Release overview</h1>
            <p>
              {userEmail} · {workspace.plan}
            </p>
          </div>
          <Link className="button ghost" href="/demo">
            Open review canvas
          </Link>
        </div>
        {error && (
          <p className="workspace-error" role="alert">
            {error}
          </p>
        )}
        <div className="metric-grid">
          <article>
            <small>ACTIVE RELEASES</small>
            <strong>
              {releases.filter((r) => r.status !== 'archived').length}
            </strong>
            <span>of 3 included</span>
          </article>
          <article>
            <small>PROJECTS</small>
            <strong>{projects.length}</strong>
            <span>in this workspace</span>
          </article>
          <article>
            <small>APPROVED</small>
            <strong>
              {releases.filter((r) => r.status === 'approved').length}
            </strong>
            <span>immutable decisions</span>
          </article>
        </div>
        <div className="workspace-columns">
          <section id="projects">
            <div className="section-title">
              <h2>Projects</h2>
              <span>{projects.length}</span>
            </div>
            <form className="inline-form" onSubmit={createProject}>
              <input name="name" required placeholder="Project name" />
              <input name="description" placeholder="Short description" />
              <button className="button primary">Add project</button>
            </form>
            {projects.map((project) => (
              <article className="workspace-row" key={project.id}>
                <div>
                  <strong>{project.name}</strong>
                  <p>{project.description || 'No description yet'}</p>
                </div>
                <span>Active</span>
              </article>
            ))}
          </section>
          <section id="releases">
            <div className="section-title">
              <h2>Releases</h2>
              <span>{releases.length}</span>
            </div>
            {projects.length > 0 && (
              <form className="inline-form" onSubmit={createRelease}>
                <select name="projectId">
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input name="name" required placeholder="Release name" />
                <button className="button primary">Create release</button>
              </form>
            )}
            {releases.map((release) => (
              <Link
                className="workspace-row"
                href={`/app/releases/${release.id}`}
                key={release.id}
              >
                <div>
                  <strong>{release.name}</strong>
                  <p>Version {release.version}</p>
                </div>
                <span className="release-state">
                  {release.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
