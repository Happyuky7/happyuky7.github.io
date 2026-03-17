import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import VideoBackground from '@/components/videoBackground/VideoBackground';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';

type ProjectTag = { name: string; readable: boolean };

type TagsInUseRow = { name: string; count: number };

const DEV_TAGS_PROJECTS_KEY = 'dev.tags.projects.v1';
const DEV_TAGS_BLOG_KEY = 'dev.tags.blog.v1';

function tagKey(name: string) {
  return String(name || '').trim().toLowerCase();
}

function cleanProjectTags(tags: unknown): ProjectTag[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t) => t && typeof t === 'object')
    .map((t: any) => ({ name: String(t?.name || '').trim(), readable: Boolean(t?.readable) }))
    .filter((t) => !!t.name);
}

function cleanBlogTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tags) {
    const name = String(t || '').trim();
    if (!name) continue;
    const k = tagKey(name);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(name);
  }
  return out;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function TagsManager() {
  const { language } = useLanguage();

  const backToHub = useMemo(() => withLang(language, '/hubdev'), [language]);

  const [projectTags, setProjectTags] = useState<ProjectTag[]>([]);
  const [blogTags, setBlogTags] = useState<string[]>([]);

  const [projectsTagsInUse, setProjectsTagsInUse] = useState<TagsInUseRow[]>([]);
  const [blogTagsInUse, setBlogTagsInUse] = useState<TagsInUseRow[]>([]);
  const [inUseError, setInUseError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [newProjectTag, setNewProjectTag] = useState('');
  const [newProjectTagReadable, setNewProjectTagReadable] = useState(true);

  const [newBlogTag, setNewBlogTag] = useState('');

  useEffect(() => {
    const p = safeJsonParse<unknown>(localStorage.getItem(DEV_TAGS_PROJECTS_KEY));
    if (p) setProjectTags(cleanProjectTags(p));

    const b = safeJsonParse<unknown>(localStorage.getItem(DEV_TAGS_BLOG_KEY));
    if (b) setBlogTags(cleanBlogTags(b));
  }, []);

  const refreshTagsInUse = async () => {
    try {
      setInUseError(null);

      const [projectsRes, blogRes] = await Promise.all([
        fetch(publicPath('/jsons/projects-real.json'), { cache: 'no-store' }),
        fetch(publicPath('/jsons/blogPosts.json'), { cache: 'no-store' }),
      ]);

      const nextProjectsRows: TagsInUseRow[] = [];
      const nextBlogRows: TagsInUseRow[] = [];

      if (projectsRes.ok) {
        const projects = (await projectsRes.json()) as any[];
        const counts = new Map<string, { name: string; count: number }>();
        for (const p of Array.isArray(projects) ? projects : []) {
          const tags = Array.isArray(p?.tags) ? p.tags : [];
          const seenInProject = new Set<string>();
          for (const t of tags) {
            const name = String(t?.name || '').trim();
            if (!name) continue;
            const k = tagKey(name);
            if (seenInProject.has(k)) continue;
            seenInProject.add(k);
            const existing = counts.get(k);
            if (existing) existing.count += 1;
            else counts.set(k, { name, count: 1 });
          }
        }
        nextProjectsRows.push(...Array.from(counts.values()).sort((a, b) => a.name.localeCompare(b.name)));
      }

      if (blogRes.ok) {
        const posts = (await blogRes.json()) as any[];
        const counts = new Map<string, { name: string; count: number }>();
        for (const p of Array.isArray(posts) ? posts : []) {
          const tags = Array.isArray(p?.tags) ? p.tags : [];
          const seenInPost = new Set<string>();
          for (const t of tags) {
            const name = String(t || '').trim();
            if (!name) continue;
            const k = tagKey(name);
            if (seenInPost.has(k)) continue;
            seenInPost.add(k);
            const existing = counts.get(k);
            if (existing) existing.count += 1;
            else counts.set(k, { name, count: 1 });
          }
        }
        nextBlogRows.push(...Array.from(counts.values()).sort((a, b) => a.name.localeCompare(b.name)));
      }

      setProjectsTagsInUse(nextProjectsRows);
      setBlogTagsInUse(nextBlogRows);
    } catch (e: any) {
      setInUseError(e?.message || String(e));
    }
  };

  useEffect(() => {
    void refreshTagsInUse();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DEV_TAGS_PROJECTS_KEY, JSON.stringify(cleanProjectTags(projectTags)));
    } catch {
      // ignore
    }
  }, [projectTags]);

  useEffect(() => {
    try {
      localStorage.setItem(DEV_TAGS_BLOG_KEY, JSON.stringify(cleanBlogTags(blogTags)));
    } catch {
      // ignore
    }
  }, [blogTags]);

  const projectKeys = useMemo(() => new Set(projectTags.map((t) => tagKey(t.name))), [projectTags]);
  const blogKeys = useMemo(() => new Set(blogTags.map((t) => tagKey(t))), [blogTags]);

  const addProjectTag = () => {
    const name = String(newProjectTag || '').trim();
    if (!name) return;
    const k = tagKey(name);
    if (projectKeys.has(k)) return;
    setProjectTags([...projectTags, { name, readable: newProjectTagReadable }]);
    setNewProjectTag('');
    setNewProjectTagReadable(true);
  };

  const addProjectTagFromName = (name: string, readable = true) => {
    const clean = String(name || '').trim();
    if (!clean) return;
    const k = tagKey(clean);
    if (projectKeys.has(k)) return;
    setProjectTags([...projectTags, { name: clean, readable }]);
  };

  const removeProjectTag = (name: string) => {
    const k = tagKey(name);
    setProjectTags(projectTags.filter((t) => tagKey(t.name) !== k));
  };

  const addBlogTag = () => {
    const name = String(newBlogTag || '').trim();
    if (!name) return;
    const k = tagKey(name);
    if (blogKeys.has(k)) return;
    setBlogTags([...blogTags, name]);
    setNewBlogTag('');
  };

  const addBlogTagFromName = (name: string) => {
    const clean = String(name || '').trim();
    if (!clean) return;
    const k = tagKey(clean);
    if (blogKeys.has(k)) return;
    setBlogTags([...blogTags, clean]);
  };

  const removeBlogTag = (name: string) => {
    const k = tagKey(name);
    setBlogTags(blogTags.filter((t) => tagKey(t) !== k));
  };

  const removeTagGlobally = async (domain: 'projects' | 'blog', name: string) => {
    const clean = String(name || '').trim();
    if (!clean) return;

    const confirmText = domain === 'projects'
      ? `¿Eliminar "${clean}" de TODOS los proyectos (jsons/projects-real.json)?`
      : `¿Eliminar "${clean}" de TODOS los posts (jsons/blogPosts.json)?`;

    if (!window.confirm(confirmText)) return;

    const opKey = `${domain}:${tagKey(clean)}`;
    setBusyKey(opKey);
    try {
      const url = domain === 'projects'
        ? '/__dev/tags-manager/projects/remove-tag'
        : '/__dev/tags-manager/blog/remove-tag';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      await refreshTagsInUse();
    } catch (e: any) {
      setInUseError(e?.message || String(e));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="relative min-h-screen">
      <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />

      <div className="relative z-10">
        <div className="min-h-screen pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="card mb-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Tags Manager (DEV)</h1>
                  <p className="text-white/60 mt-1 text-sm">Crea y elimina tags globales (independientes) para blog y projects.</p>
                </div>
                <Link to={backToHub} className="btn-primary">Volver al hub</Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-3">Projects: pool global</h2>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <input
                    className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                    value={newProjectTag}
                    onChange={(e) => setNewProjectTag(e.target.value)}
                    placeholder="Nuevo tag (ej: Backend)"
                  />
                  <label className="inline-flex items-center gap-2 text-white/80 text-sm px-3 py-2 rounded-xl bg-black/20 border border-white/10">
                    <input type="checkbox" checked={newProjectTagReadable} onChange={(e) => setNewProjectTagReadable(e.target.checked)} />
                    readable
                  </label>
                  <button type="button" className="btn-primary" onClick={addProjectTag} disabled={!String(newProjectTag).trim()}>
                    Crear
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {projectTags
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((t) => (
                      <div key={tagKey(t.name)} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 border border-white/10 px-3 py-2">
                        <div className="text-white/80 text-sm min-w-0">
                          <div className="truncate">{t.name}</div>
                          <div className="text-white/40 text-xs">readable: {t.readable ? 'true' : 'false'}</div>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-red-500/15 hover:border-red-500/30 transition text-xs"
                          onClick={() => removeProjectTag(t.name)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  {!projectTags.length ? <div className="text-white/60 text-sm">No hay tags globales para projects.</div> : null}
                </div>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-white font-semibold">Tags en uso (projects)</h3>
                    <button type="button" className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-white/10 transition text-xs" onClick={refreshTagsInUse}>
                      Recargar
                    </button>
                  </div>
                  {inUseError ? <div className="mt-2 text-red-300 text-xs">{inUseError}</div> : null}

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {projectsTagsInUse.map((row) => (
                      <div key={`p:${tagKey(row.name)}`} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 border border-white/10 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-white/80 text-sm truncate">{row.name}</div>
                          <div className="text-white/40 text-xs">{row.count} proyecto(s)</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-white/10 transition text-xs"
                            onClick={() => addProjectTagFromName(row.name, true)}
                            disabled={projectKeys.has(tagKey(row.name))}
                          >
                            + pool
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-red-500/15 hover:border-red-500/30 transition text-xs"
                            onClick={() => removeTagGlobally('projects', row.name)}
                            disabled={busyKey === `projects:${tagKey(row.name)}`}
                          >
                            Eliminar global
                          </button>
                        </div>
                      </div>
                    ))}
                    {!projectsTagsInUse.length ? <div className="text-white/60 text-sm">No se detectaron tags en uso en projects.</div> : null}
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold text-white mb-3">Blog: pool global</h2>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <input
                    className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                    value={newBlogTag}
                    onChange={(e) => setNewBlogTag(e.target.value)}
                    placeholder="Nuevo tag (ej: Devlog)"
                  />
                  <button type="button" className="btn-primary" onClick={addBlogTag} disabled={!String(newBlogTag).trim()}>
                    Crear
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {blogTags
                    .slice()
                    .sort((a, b) => a.localeCompare(b))
                    .map((t) => (
                      <div key={tagKey(t)} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 border border-white/10 px-3 py-2">
                        <div className="text-white/80 text-sm truncate">{t}</div>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-red-500/15 hover:border-red-500/30 transition text-xs"
                          onClick={() => removeBlogTag(t)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  {!blogTags.length ? <div className="text-white/60 text-sm">No hay tags globales para blog.</div> : null}
                </div>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-white font-semibold">Tags en uso (blog)</h3>
                    <button type="button" className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-white/10 transition text-xs" onClick={refreshTagsInUse}>
                      Recargar
                    </button>
                  </div>
                  {inUseError ? <div className="mt-2 text-red-300 text-xs">{inUseError}</div> : null}

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {blogTagsInUse.map((row) => (
                      <div key={`b:${tagKey(row.name)}`} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 border border-white/10 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-white/80 text-sm truncate">{row.name}</div>
                          <div className="text-white/40 text-xs">{row.count} post(s)</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-white/10 transition text-xs"
                            onClick={() => addBlogTagFromName(row.name)}
                            disabled={blogKeys.has(tagKey(row.name))}
                          >
                            + pool
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-red-500/15 hover:border-red-500/30 transition text-xs"
                            onClick={() => removeTagGlobally('blog', row.name)}
                            disabled={busyKey === `blog:${tagKey(row.name)}`}
                          >
                            Eliminar global
                          </button>
                        </div>
                      </div>
                    ))}
                    {!blogTagsInUse.length ? <div className="text-white/60 text-sm">No se detectaron tags en uso en blog.</div> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-white/50 text-xs">
              Pool global: <span className="font-mono">localStorage</span> (DEV). “Eliminar global” modifica <span className="font-mono">public/jsons/*.json</span> (solo en <span className="font-mono">npm run dev</span>).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
