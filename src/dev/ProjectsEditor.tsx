import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import VideoBackground from '@/components/videoBackground/VideoBackground';
import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import { publicPath } from '@/utils/publicPath';
import BlogMarkdown from '@/components/blog/BlogMarkdown';

const SUPPORTED_LANGS = ['en', 'es', 'ja', 'fr', 'de', 'pt', 'pl', 'ru', 'zh', 'ko', 'th', 'fil'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

type LocalizedText = Record<string, string | undefined>;

type ProjectTag = { name: string; readable: boolean };

type Project = {
  name: string;
  displayName?: string;
  description?: string | LocalizedText;
  image?: string;
  link?: string;
  demo?: string | null;
  github?: string | null;
  readme?: string;
  directLink?: boolean | null;
  hidden?: boolean;
  tags?: ProjectTag[];
  id?: string;
  [key: string]: any;
};

function toSlug(value: string) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getLocalizedText(text: Project['description'], lang: string) {
  if (!text) return '';
  if (typeof text === 'string') return text;
  const m = text as LocalizedText;
  return m[lang] || m.en || Object.values(m)[0] || '';
}

function ensureLocalizedDescription(description: Project['description']): LocalizedText {
  if (!description) return {};
  if (typeof description === 'string') return { en: description };
  return description as LocalizedText;
}

function safeClone<T>(v: T): T {
  try {
    // eslint-disable-next-line no-undef
    return structuredClone(v);
  } catch {
    return JSON.parse(JSON.stringify(v));
  }
}

function tagKey(name: string) {
  return String(name || '').trim().toLowerCase();
}

function cleanTags(tags: unknown): ProjectTag[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t) => t && typeof t === 'object')
    .map((t: any) => ({
      name: String(t?.name || '').trim(),
      readable: Boolean(t?.readable),
    }))
    .filter((t) => !!t.name);
}

function normalizeDirectLink(v: unknown): boolean | null | undefined {
  if (v === null || v === undefined) return v as null | undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1 ? true : v === 0 ? false : undefined;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (!s) return undefined;
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
    if (s === 'unset' || s === 'null' || s === 'undefined') return undefined;
  }
  return undefined;
}

type ImageAsset = { file: string; url: string };

type MdImageLayout = 'inline' | 'right' | 'left' | 'center';
type MdImageInsertType = 'simple' | 'caption' | 'dimensions';

type ViewMode = 'project' | 'tags' | 'readme';

const DEV_TAGS_PROJECTS_KEY = 'dev.tags.projects.v1';
const DEV_TAGS_PROJECTS_LEGACY_KEY = 'devProjectsEditor.customTagPool';

const PROJECTS_DRAFT_STORAGE_BASE_KEY = 'dev.projectsEditor.draft.v1';

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function makeDraftId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ProjectsEditor() {
  const { language } = useLanguage();
  const { slug: slugParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const uiLang = (language || 'en').toLowerCase() as SupportedLang;

  const draftId = useMemo(() => {
    const sp = new URLSearchParams(location.search || '');
    return String(sp.get('draftId') || '').trim();
  }, [location.search]);

  const draftStorageKey = useMemo(() => {
    if (!draftId) return '';
    return `${PROJECTS_DRAFT_STORAGE_BASE_KEY}::draft::${draftId}`;
  }, [draftId]);

  const isDraftRoute = !!draftId;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [draft, setDraft] = useState<Project | null>(null);
  const [descLang, setDescLang] = useState<SupportedLang>(uiLang);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'idle' | 'saving' | 'ok' | 'error'; message?: string }>({ type: 'idle' });

  const [viewMode, setViewMode] = useState<ViewMode>('project');

  const [customTagPool, setCustomTagPool] = useState<ProjectTag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagReadable, setNewTagReadable] = useState(true);

  const [imagesOpen, setImagesOpen] = useState(false);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [imagesBusy, setImagesBusy] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [readmeText, setReadmeText] = useState('');
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeStatus, setReadmeStatus] = useState<{ type: 'idle' | 'saving' | 'ok' | 'error'; message?: string }>({ type: 'idle' });

  const readmeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [readmeLogosOpen, setReadmeLogosOpen] = useState(false);
  const [readmeLogoUploadBusy, setReadmeLogoUploadBusy] = useState(false);
  const [readmeLogosError, setReadmeLogosError] = useState<string | null>(null);

  const [readmeTableSize, setReadmeTableSize] = useState<'2x2' | '3x3' | '4x4'>('2x2');
  const [readmeCodeLang, setReadmeCodeLang] = useState(
    'tsx' as
      | 'tsx'
      | 'ts'
      | 'jsx'
      | 'js'
      | 'json'
      | 'bash'
      | 'sh'
      | 'powershell'
      | 'python'
      | 'java'
      | 'c'
      | 'cpp'
      | 'go'
      | 'rust'
      | 'sql'
      | 'yaml'
      | 'toml'
      | 'dockerfile'
      | 'css'
      | 'html'
      | 'md'
      | 'txt'
      | ''
  );

  const [readmeImageLayout, setReadmeImageLayout] = useState<MdImageLayout>('inline');
  const [readmeImageType, setReadmeImageType] = useState<MdImageInsertType>('caption');
  const [readmeImageAlt, setReadmeImageAlt] = useState('alt text');
  const [readmeImageWidth, setReadmeImageWidth] = useState('420');
  const [readmeImageHeight, setReadmeImageHeight] = useState('');

  const selectedSlug = useMemo(() => {
    const name = (draft?.id || draft?.name || '').toString();
    return toSlug(name);
  }, [draft?.id, draft?.name]);

  useEffect(() => {
    // DEV-only: persist a global tag pool in browser localStorage
    try {
      const raw = localStorage.getItem(DEV_TAGS_PROJECTS_KEY) || localStorage.getItem(DEV_TAGS_PROJECTS_LEGACY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const list = parsed
        .filter((t) => t && typeof t === 'object')
        .map((t: any) => ({ name: String(t?.name || '').trim(), readable: Boolean(t?.readable) }))
        .filter((t) => !!t.name);
      setCustomTagPool(list);

      // migrate legacy -> new key if needed
      try {
        if (!localStorage.getItem(DEV_TAGS_PROJECTS_KEY)) {
          localStorage.setItem(DEV_TAGS_PROJECTS_KEY, JSON.stringify(list));
        }
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DEV_TAGS_PROJECTS_KEY, JSON.stringify(cleanTags(customTagPool)));
    } catch {
      // ignore
    }
  }, [customTagPool]);

  useEffect(() => {
    if ((SUPPORTED_LANGS as readonly string[]).includes(uiLang)) setDescLang(uiLang);
  }, [uiLang]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(publicPath('/jsons/projects-real.json'), { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? (data as Project[]).filter((p) => p && typeof p === 'object' && (p as any).name) : [];
        if (cancelled) return;
        setProjects(list);

        if (isDraftRoute) {
          const loaded = safeJsonParse<Partial<Project>>(localStorage.getItem(draftStorageKey));
          const baseName = (() => {
            const used = new Set(list.map((p) => String(p?.name || '').trim()).filter(Boolean));
            const base = 'new-project';
            if (!used.has(base)) return base;
            for (let i = 2; i < 200; i++) {
              const next = `${base}-${i}`;
              if (!used.has(next)) return next;
            }
            return `${base}-${Date.now()}`;
          })();

          const baseDraft: Project = {
            name: baseName,
            displayName: '',
            description: { [uiLang]: '' },
            image: '',
            link: '',
            demo: null,
            github: null,
            readme: '',
            directLink: false,
            hidden: false,
            tags: [],
          };

          const nextDraft = safeClone({ ...baseDraft, ...(loaded || {}) } as Project);
          setSelectedIndex(-1);
          setDraft(nextDraft);
          setStatus({ type: 'idle' });
          setReadmeStatus({ type: 'idle' });
          setViewMode('project');

          // Ensure the draft exists on disk so refresh won't lose it.
          try {
            localStorage.setItem(draftStorageKey, JSON.stringify(nextDraft));
          } catch {
            // ignore
          }

          return;
        }

        const requestedSlug = String(slugParam || '').trim();
        const decodedSlug = requestedSlug ? decodeURIComponent(requestedSlug) : '';
        const findIdx = decodedSlug
          ? list.findIndex((p) => toSlug(String((p as any)?.id || (p as any)?.name || '')) === decodedSlug)
          : -1;
        const idx = findIdx >= 0 ? findIdx : -1;

        if (idx >= 0) {
          setSelectedIndex(idx);
          setDraft(safeClone(list[idx]));
        } else {
          setSelectedIndex(-1);
          setDraft(null);
        }
        setStatus({ type: 'idle' });
      } catch (e: any) {
        console.error('Error loading projects:', e);
        if (!cancelled) {
          setProjects([]);
          setSelectedIndex(-1);
          setDraft(null);
          setStatus({ type: 'error', message: e?.message || String(e) });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, slugParam, uiLang, isDraftRoute, draftStorageKey]);

  useEffect(() => {
    if (!isDraftRoute) return;
    if (!draftStorageKey) return;
    if (!draft) return;
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft, draftStorageKey, isDraftRoute]);

  const selectProject = (index: number) => {
    const p = projects[index];
    if (!p) return;
    setSelectedIndex(index);
    setDraft(safeClone(p));
    setStatus({ type: 'idle' });
    setReadmeStatus({ type: 'idle' });
  };

  const updateDraft = (patch: Partial<Project>) => {
    setDraft((prev) => ({ ...(prev || ({} as Project)), ...patch }));
    setStatus({ type: 'idle' });
  };

  const updateDescription = (langKey: SupportedLang, value: string) => {
    const current = ensureLocalizedDescription(draft?.description);
    updateDraft({ description: { ...current, [langKey]: value } });
  };

  const ensureUniqueName = (base: string) => {
    const used = new Set(projects.map((p) => String(p?.name || '').trim()).filter(Boolean));
    if (!used.has(base)) return base;
    for (let i = 2; i < 200; i++) {
      const next = `${base}-${i}`;
      if (!used.has(next)) return next;
    }
    return `${base}-${Date.now()}`;
  };

  const addNewProject = () => {
    const id = makeDraftId();
    const name = ensureUniqueName('new-project');
    const next: Project = {
      name,
      displayName: '',
      description: { [uiLang]: '' },
      image: '',
      link: '',
      demo: null,
      github: null,
      readme: '',
      directLink: false,
      hidden: false,
      tags: [],
    };

    const key = `${PROJECTS_DRAFT_STORAGE_BASE_KEY}::draft::${id}`;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }

    navigate(withLang(language, `/projectseditor/editor?draftId=${encodeURIComponent(id)}`));
  };

  const save = async () => {
    if (!draft) return;

    const draftName = String(draft?.name || '').trim();
    if (!draftName) {
      setStatus({ type: 'error', message: 'El campo name es requerido.' });
      return;
    }

    const draftSlugForUniq = toSlug(String((draft as any)?.id || draftName));
    if (selectedIndex < 0) {
      const used = new Set(projects.map((p) => toSlug(String((p as any)?.id || (p as any)?.name || ''))).filter(Boolean));
      if (draftSlugForUniq && used.has(draftSlugForUniq)) {
        setStatus({ type: 'error', message: `Ya existe un proyecto con slug "${draftSlugForUniq}". Cambia el name.` });
        return;
      }
    }

    const nextProjects = selectedIndex >= 0
      ? projects.map((p, idx) => (idx === selectedIndex ? draft : p))
      : [draft, ...projects];

    // Very light validation (the consumer already filters by name)
    const cleaned = nextProjects
      .map((p) => ({
        ...p,
        name: String(p?.name || '').trim(),
        directLink: normalizeDirectLink((p as any)?.directLink) ?? null,
        hidden: Boolean((p as any)?.hidden),
        tags: cleanTags(p?.tags),
      }))
      .filter((p) => !!p.name);

    try {
      setStatus({ type: 'saving', message: 'Guardando…' });
      const res = await fetch('/__dev/projects-editor/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projects: cleaned }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Error HTTP ${res.status}`);
      }
      setProjects(cleaned);
      setStatus({ type: 'ok', message: `Guardado (${data.count} proyectos)` });

      if (isDraftRoute && draftStorageKey) {
        try {
          localStorage.removeItem(draftStorageKey);
        } catch {
          // ignore
        }

        const finalSlug = toSlug(String((draft as any)?.id || draft.name || '')).trim();
        if (finalSlug) {
          navigate(withLang(language, `/projectseditor/editor/${encodeURIComponent(finalSlug)}`));
        }
      }
    } catch (e: any) {
      console.error('Save failed:', e);
      setStatus({ type: 'error', message: e?.message || String(e) });
    }
  };

  const createLocalReadme = async () => {
    if (!draft) return;
    const slug = selectedSlug;
    if (!slug) {
      setStatus({ type: 'error', message: 'No puedo crear README: slug vacío.' });
      return;
    }

    const title = (draft.displayName || draft.name || slug).toString();
    const template = `# ${title}\n\n## Resumen\n\n- Qué hace\n- Tecnologías\n- Capturas\n\n## Enlaces\n\n- Demo: ${draft.demo || ''}\n- Repo: ${draft.github || ''}\n`;

    try {
      setStatus({ type: 'saving', message: 'Creando README…' });
      const res = await fetch('/__dev/projects-editor/create-readme', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, content: template, overwrite: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setStatus({ type: 'error', message: 'El README ya existe (no se sobreescribió).' });
        updateDraft({ readme: draft.readme || `/projects-content/${slug}/${slug}.md` });
        return;
      }
      if (!res.ok || !data?.ok) throw new Error(data?.error || `Error HTTP ${res.status}`);

      updateDraft({ readme: `/projects-content/${slug}/${slug}.md` });
      setStatus({ type: 'ok', message: `README creado: ${data.wrote}` });
    } catch (e: any) {
      console.error('Create README failed:', e);
      setStatus({ type: 'error', message: e?.message || String(e) });
    }
  };

  const canEditLocalReadme = useMemo(() => {
    const p = String(draft?.readme || '').trim();
    return !!p && p.startsWith('/projects-content/') && p.toLowerCase().endsWith('.md');
  }, [draft?.readme]);

  const copyToClipboard = async (text: string) => {
    const value = String(text || '');
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
  };

  const mdSmallBtn =
    'px-3 py-1.5 rounded-full border border-white/10 bg-black/20 text-white/80 text-xs ' +
    'hover:bg-white/5 hover:border-white/20 transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';
  const mdSmallField =
    'px-3 py-1.5 rounded-full bg-black/20 text-white border border-white/10 text-xs ' +
    'focus:outline-none focus:border-primary/40';

  const applyReadmeInsert = (before: string, after = '') => {
    const el = readmeTextareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);

    setReadmeText(next);
    setReadmeStatus({ type: 'idle' });

    requestAnimationFrame(() => {
      try {
        el.focus();
        const cursor = start + before.length + selected.length;
        el.setSelectionRange(cursor, cursor);
      } catch {
        // ignore
      }
    });
  };

  const insertReadmeLinePrefix = (prefix: string) => {
    const el = readmeTextareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart ?? value.length;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);

    setReadmeText(next);
    setReadmeStatus({ type: 'idle' });

    requestAnimationFrame(() => {
      try {
        el.focus();
        const cursor = lineStart + prefix.length;
        el.setSelectionRange(cursor, cursor);
      } catch {
        // ignore
      }
    });
  };

  const insertReadmeCodeBlock = () => {
    const lang = (readmeCodeLang || '').trim();
    const header = `\n\n\
\
\`\`\`${lang}\n`;
    const footer = `\n\`\`\`\n\n`;
    applyReadmeInsert(header, footer);
  };

  const insertReadmeTable = (cols: number, rows: number) => {
    const safeCols = Math.max(2, Math.min(8, Math.floor(cols)));
    const safeRows = Math.max(1, Math.min(20, Math.floor(rows)));

    const header = `| ${Array.from({ length: safeCols }, (_, i) => `Col${i + 1}`).join(' | ')} |`;
    const sep = `| ${Array.from({ length: safeCols }, () => '----').join(' | ')} |`;
    const body = Array.from({ length: safeRows }, () => `| ${Array.from({ length: safeCols }, () => '...').join(' | ')} |`).join('\n');
    applyReadmeInsert(`\n\n${header}\n${sep}\n${body}\n\n`);
  };

  const insertReadmeAlignBlock = (align: 'left' | 'center' | 'right') => {
    const el = readmeTextareaRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const hasSelection = selected.trim().length > 0;

    const before = `\n\n<div style="text-align:${align}">\n\n`;
    const after = `\n\n</div>\n\n`;
    const inner = hasSelection ? selected : 'Texto aquí';
    const next = value.slice(0, start) + before + inner + after + value.slice(end);

    setReadmeText(next);
    setReadmeStatus({ type: 'idle' });

    requestAnimationFrame(() => {
      try {
        el.focus();
        if (hasSelection) {
          const cursor = start + before.length + inner.length;
          el.setSelectionRange(cursor, cursor);
        } else {
          const selStart = start + before.length;
          const selEnd = selStart + inner.length;
          el.setSelectionRange(selStart, selEnd);
        }
      } catch {
        // ignore
      }
    });
  };

  const insertReadmeImageWithUrl = (url: string) => {
    const u = String(url || '').trim();
    if (!u) return;

    const width = Number(readmeImageWidth);
    const safeWidth = Number.isFinite(width) && width > 50 ? Math.min(1200, Math.max(120, width)) : 420;

    const height = Number(readmeImageHeight);
    const safeHeight =
      readmeImageType === 'dimensions' && Number.isFinite(height) && height > 50 ? Math.min(2000, Math.max(120, height)) : null;

    const alt = (readmeImageAlt || 'alt text').trim() || 'alt text';

    if (readmeImageType === 'simple' && readmeImageLayout === 'inline') {
      applyReadmeInsert(`![${alt}](${u})\n\n`);
      return;
    }
    if (readmeImageType === 'caption' && readmeImageLayout === 'inline') {
      applyReadmeInsert(`![${alt}](${u})\n\n*Caption*\n\n`);
      return;
    }

    const effectiveLayout: MdImageLayout = readmeImageLayout === 'inline' ? 'center' : readmeImageLayout;
    const float = effectiveLayout === 'right' ? 'right' : effectiveLayout === 'left' ? 'left' : 'none';
    const margin = float === 'right' ? '0 0 1rem 1rem' : float === 'left' ? '0 1rem 1rem 0' : '0 auto 1rem auto';
    const figureStyle =
      float === 'none'
        ? `display:block;margin:${margin};max-width:100%;width:${safeWidth}px;`
        : `float:${float};margin:${margin};max-width:100%;width:${safeWidth}px;`;

    const imgStyle = 'width:100%;display:block;' + (safeHeight ? `height:${safeHeight}px;object-fit:cover;` : 'height:auto;');

    applyReadmeInsert(
      `\n\n<figure style="${figureStyle}">\n` +
        `  <img src="${u}" alt="${alt}" style="${imgStyle}" />\n` +
        (readmeImageType === 'caption' ? `  <figcaption>Caption</figcaption>\n` : '') +
        `</figure>\n` +
        `<div style="clear:both"></div>\n\n`
    );
  };

  const insertReadmeImageSample = () => {
    insertReadmeImageWithUrl('https://example.com/image.png');
  };

  const clearReadme = () => {
    updateDraft({ readme: '' });
    setReadmeText('');
    setReadmeStatus({ type: 'idle' });
  };

  const loadReadmeTextFrom = async (readmeRef?: string) => {
    if (!draft) return;
    const p = String(readmeRef ?? draft.readme ?? '').trim();
    if (!p) {
      setReadmeStatus({ type: 'error', message: 'No hay README asignado.' });
      setReadmeText('');
      return;
    }

    const isRemote = /^https?:\/\//i.test(p);
    const fetchUrl = isRemote ? p : publicPath(p);

    try {
      setReadmeLoading(true);
      setReadmeStatus({ type: 'idle' });
      const res = await fetch(fetchUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setReadmeText(text);
    } catch (e: any) {
      setReadmeStatus({ type: 'error', message: e?.message || String(e) });
      setReadmeText('');
    } finally {
      setReadmeLoading(false);
    }
  };

  const loadLocalReadmeText = async () => loadReadmeTextFrom();

  const saveLocalReadmeText = async () => {
    if (!draft) return;
    const slug = selectedSlug;
    if (!slug) {
      setReadmeStatus({ type: 'error', message: 'Slug vacío.' });
      return;
    }
    const p = String(draft.readme || '').trim();
    if (!p || !p.startsWith('/projects-content/') || !p.toLowerCase().endsWith('.md')) {
      setReadmeStatus({ type: 'error', message: 'README no es un path local editable.' });
      return;
    }

    try {
      setReadmeStatus({ type: 'saving', message: 'Guardando README…' });
      const res = await fetch('/__dev/projects-editor/save-readme', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, content: readmeText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setReadmeStatus({ type: 'ok', message: `README guardado: ${data.wrote}` });
    } catch (e: any) {
      setReadmeStatus({ type: 'error', message: e?.message || String(e) });
    }
  };

  const uploadReadmeFile = async (file: File) => {
    if (!file) return;
    if (!draft) return;
    const slug = selectedSlug;
    if (!slug) {
      setReadmeStatus({ type: 'error', message: 'Slug vacío.' });
      return;
    }
    try {
      setReadmeStatus({ type: 'saving', message: 'Subiendo README…' });
      const content = await file.text();
      const res = await fetch('/__dev/projects-editor/save-readme', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      updateDraft({ readme: `/projects-content/${slug}/${slug}.md` });
      setReadmeText(content);
      setReadmeStatus({ type: 'ok', message: `README subido: ${data.wrote}` });
    } catch (e: any) {
      setReadmeStatus({ type: 'error', message: e?.message || String(e) });
    }
  };

  const setRepoReadmeUrl = () => {
    if (!draft) return;
    const githubUrl = String(draft.github || '').trim();
    const m = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
    if (!m) {
      setReadmeStatus({ type: 'error', message: 'GitHub URL inválida (no se pudo extraer owner/repo).' });
      return;
    }
    const owner = m[1];
    const repo = m[2].replace(/\.git$/i, '');
    // We can't know main vs master reliably without an API call; set main as default.
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`;
    updateDraft({ readme: url });
    setReadmeStatus({ type: 'ok', message: 'Asignado README del repo (main/README.md).' });
    void loadReadmeTextFrom(url);
  };

  const deleteLocalReadme = async () => {
    if (!draft) return;
    const slug = selectedSlug;
    if (!slug) {
      setReadmeStatus({ type: 'error', message: 'Slug vacío.' });
      return;
    }

    if (!window.confirm('¿Eliminar el README local de este proyecto?')) return;

    try {
      setReadmeStatus({ type: 'saving', message: 'Eliminando README…' });
      const res = await fetch('/__dev/projects-editor/delete-readme', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      clearReadme();
      setReadmeStatus({ type: 'ok', message: data?.deleted ? 'README local eliminado.' : 'README local no existía.' });
    } catch (e: any) {
      setReadmeStatus({ type: 'error', message: e?.message || String(e) });
    }
  };

  const uploadLogoToGlobalPool = async (file: File | null) => {
    if (!file) return;
    try {
      setReadmeLogoUploadBusy(true);
      setReadmeLogosError(null);

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/__dev/projects-editor/upload-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, dataUrl }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      await loadImages();
    } catch (e: any) {
      setReadmeLogosError(e?.message || String(e));
    } finally {
      setReadmeLogoUploadBusy(false);
    }
  };

  const tagCatalog = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();

    const add = (nameRaw: string) => {
      const name = String(nameRaw || '').trim();
      if (!name) return;
      const key = tagKey(name);
      const cur = counts.get(key);
      if (!cur) counts.set(key, { name, count: 1 });
      else counts.set(key, { name: cur.name || name, count: cur.count + 1 });
    };

    for (const p of projects) {
      for (const t of cleanTags(p?.tags)) add(t.name);
    }

    for (const t of cleanTags(customTagPool)) {
      const name = String(t?.name || '').trim();
      if (!name) continue;
      const key = tagKey(name);
      if (!counts.has(key)) counts.set(key, { name, count: 0 });
    }

    // Also include current draft tags so a new tag appears immediately
    for (const t of cleanTags(draft?.tags)) {
      const name = String(t?.name || '').trim();
      if (!name) continue;
      const key = tagKey(name);
      if (!counts.has(key)) counts.set(key, { name, count: 0 });
    }

    return [...counts.entries()]
      .map(([key, v]) => ({ key, name: v.name, count: v.count }))
      .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
  }, [projects, customTagPool, draft?.tags]);

  const suggestedTags = useMemo(() => tagCatalog.filter((t) => t.count > 0).slice(0, 12), [tagCatalog]);

  const assignedTags = useMemo(() => cleanTags(draft?.tags), [draft?.tags]);
  const assignedByKey = useMemo(() => {
    const m = new Map<string, ProjectTag>();
    for (const t of assignedTags) m.set(tagKey(t.name), t);
    return m;
  }, [assignedTags]);

  const setTagAssigned = (name: string, assigned: boolean) => {
    if (!draft) return;
    const key = tagKey(name);
    const tags = [...cleanTags(draft.tags)];
    const idx = tags.findIndex((t) => tagKey(t.name) === key);

    if (assigned) {
      if (idx >= 0) return;
      tags.push({ name: String(name || '').trim(), readable: true });
    } else {
      if (idx < 0) return;
      tags.splice(idx, 1);
    }

    updateDraft({ tags });
  };

  const setTagReadable = (name: string, readable: boolean) => {
    if (!draft) return;
    const key = tagKey(name);
    const tags = [...cleanTags(draft.tags)];
    const idx = tags.findIndex((t) => tagKey(t.name) === key);
    if (idx < 0) return;
    tags[idx] = { ...tags[idx], readable };
    updateDraft({ tags });
  };

  const createTagAndAssign = () => {
    const name = String(newTagName || '').trim();
    if (!name) return;

    const nextPool = [...cleanTags(customTagPool)];
    const k = tagKey(name);
    if (!nextPool.some((t) => tagKey(t.name) === k)) {
      nextPool.push({ name, readable: newTagReadable });
      setCustomTagPool(nextPool);
    }

    if (draft) {
      const tags = [...cleanTags(draft.tags)];
      if (!tags.some((t) => tagKey(t.name) === k)) {
        tags.push({ name, readable: newTagReadable });
        updateDraft({ tags });
      }
    }

    setNewTagName('');
    setNewTagReadable(true);
  };

  const customPoolKeys = useMemo(() => {
    const s = new Set<string>();
    for (const t of cleanTags(customTagPool)) s.add(tagKey(t.name));
    return s;
  }, [customTagPool]);

  const removeFromCustomPool = (name: string) => {
    const key = tagKey(name);
    const next = cleanTags(customTagPool).filter((t) => tagKey(t.name) !== key);
    setCustomTagPool(next);
  };

  const loadImages = async () => {
    try {
      setImagesBusy(true);
      setImagesError(null);
      const res = await fetch('/__dev/projects-editor/list-images', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      const list = Array.isArray(data?.images) ? (data.images as ImageAsset[]) : [];
      setImages(list.filter((i) => i && typeof i === 'object' && typeof (i as any).url === 'string' && typeof (i as any).file === 'string'));
    } catch (e: any) {
      setImagesError(e?.message || String(e));
      setImages([]);
    } finally {
      setImagesBusy(false);
    }
  };

  useEffect(() => {
    // Preload logos so they are ready to assign.
    void loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openImages = async () => {
    setImagesOpen(true);
    if (!images.length) await loadImages();
  };

  const uploadImageFile = async (file: File) => {
    if (!file) return;
    try {
      setUploadBusy(true);
      setImagesError(null);

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/__dev/projects-editor/upload-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, dataUrl }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      const url = String(json?.url || '');
      if (url) updateDraft({ image: url });
      await loadImages();
    } catch (e: any) {
      setImagesError(e?.message || String(e));
    } finally {
      setUploadBusy(false);
    }
  };

  const projectsList = useMemo(() => {
    return projects.map((p, idx) => ({
      idx,
      name: String(p?.displayName || p?.name || `#${idx + 1}`),
      rawName: String(p?.name || ''),
    }));
  }, [projects]);

  const hubUrl = useMemo(() => withLang(language, '/projectseditor'), [language]);
  const backToHub = hubUrl;
  const editorUrl = useMemo(() => {
    if (isDraftRoute && draftId) return withLang(language, `/projectseditor/editor?draftId=${encodeURIComponent(draftId)}`);
    if (!selectedSlug) return withLang(language, '/projectseditor/editor');
    return withLang(language, `/projectseditor/editor/${encodeURIComponent(selectedSlug)}`);
  }, [language, selectedSlug, isDraftRoute, draftId]);

  const gotoProjectSlug = (slug: string) => {
    const s = String(slug || '').trim();
    if (!s) return;
    navigate(withLang(language, `/projectseditor/editor/${encodeURIComponent(s)}`));
  };

  const deleteCurrentProject = async () => {
    if (isDraftRoute) {
      if (!window.confirm('¿Descartar este draft?')) return;
      try {
        if (draftStorageKey) localStorage.removeItem(draftStorageKey);
      } catch {
        // ignore
      }
      setDraft(null);
      setSelectedIndex(-1);
      navigate(withLang(language, '/projectseditor/editor'));
      return;
    }

    if (selectedIndex < 0) return;
    const current = projects[selectedIndex];
    const label = String(current?.displayName || current?.name || '').trim() || `#${selectedIndex + 1}`;
    if (!window.confirm(`¿Eliminar el proyecto "${label}"? (No borra archivos README/imagenes)`)) return;

    const next = projects.filter((_, idx) => idx !== selectedIndex);
    try {
      setStatus({ type: 'saving', message: 'Eliminando…' });
      const res = await fetch('/__dev/projects-editor/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projects: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `Error HTTP ${res.status}`);
      setProjects(next);

      if (!next.length) {
        setSelectedIndex(-1);
        setDraft(null);
        setStatus({ type: 'ok', message: 'Eliminado (0 proyectos)' });
        navigate(withLang(language, '/projectseditor/editor'));
        return;
      }

      const newIdx = Math.min(selectedIndex, next.length - 1);
      setSelectedIndex(newIdx);
      setDraft(safeClone(next[newIdx]));
      const newSlug = toSlug(String((next[newIdx] as any)?.id || (next[newIdx] as any)?.name || '')).trim();
      setStatus({ type: 'ok', message: `Eliminado (${data.count} proyectos)` });
      if (newSlug) navigate(withLang(language, `/projectseditor/editor/${encodeURIComponent(newSlug)}`));
    } catch (e: any) {
      setStatus({ type: 'error', message: e?.message || String(e) });
    }
  };

  return (
    <div className="relative min-h-screen">
      <VideoBackground videoSrc="/assets/video/background5.gif" overlay={true} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-16">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Projects Editor (DEV)</h1>
          <div className="text-white/70 text-sm">
            Edita <span className="font-mono">public/jsons/projects-real.json</span> y (opcional) crea README local en <span className="font-mono">public/projects-content</span>.
          </div>
          <div className="text-white/60 text-xs">Ruta: <span className="font-mono">{editorUrl}</span></div>
        </div>

        {loading ? (
          <div className="card p-6 bg-dark-lighter/40">Cargando…</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="card p-5 bg-dark-lighter/40">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <h2 className="font-semibold text-white">Editor</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={backToHub} className="px-4 py-2 rounded-2xl bg-black/30 border border-white/10 text-white hover:bg-black/40 transition">
                        Volver
                      </Link>

                      <Link to={withLang(language, '/hubdev/tags')} className="px-4 py-2 rounded-2xl bg-black/30 border border-white/10 text-white hover:bg-black/40 transition">
                        Tags Manager
                      </Link>

                      <div className="flex items-center gap-2 rounded-2xl bg-black/30 border border-white/10 px-3 py-2">
                        <span className="text-white/70 text-sm">Proyecto</span>
                        <select
                          className="bg-transparent text-white text-sm outline-none"
                          value={selectedIndex >= 0 && projectsList[selectedIndex]?.rawName ? toSlug(projectsList[selectedIndex].rawName) : ''}
                          onChange={(e) => {
                            const slug = e.target.value;
                            const found = projectsList.find((p) => toSlug(p.rawName) === slug);
                            if (found) selectProject(found.idx);
                            gotoProjectSlug(slug);
                          }}
                        >
                          {isDraftRoute ? (
                            <option value="" className="bg-black">
                              (Draft nuevo)
                            </option>
                          ) : null}
                          {projectsList.map((p) => (
                            <option key={`${p.rawName}-${p.idx}`} value={toSlug(p.rawName)} className="bg-black">
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button type="button" className="btn-primary" onClick={addNewProject}>
                        + Nuevo
                      </button>
                      <button
                        type="button"
                        className={
                          'px-4 py-2 rounded-2xl border transition ' +
                          (viewMode === 'project' ? 'bg-primary/15 border-primary/40 text-white' : 'bg-black/30 border-white/10 text-white/80 hover:bg-black/40')
                        }
                        onClick={() => setViewMode('project')}
                      >
                        Proyecto
                      </button>
                      <button
                        type="button"
                        className={
                          'px-4 py-2 rounded-2xl border transition ' +
                          (viewMode === 'tags' ? 'bg-primary/15 border-primary/40 text-white' : 'bg-black/30 border-white/10 text-white/80 hover:bg-black/40')
                        }
                        onClick={() => setViewMode('tags')}
                      >
                        Tags
                      </button>
                      <button
                        type="button"
                        className={
                          'px-4 py-2 rounded-2xl border transition ' +
                          (viewMode === 'readme' ? 'bg-primary/15 border-primary/40 text-white' : 'bg-black/30 border-white/10 text-white/80 hover:bg-black/40')
                        }
                        onClick={() => {
                          setViewMode('readme');
                          void loadLocalReadmeText();
                        }}
                      >
                        README
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" className="btn-primary" onClick={() => void save()} disabled={!draft || status.type === 'saving'}>
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-2xl border border-red-500/30 bg-red-500/15 text-white hover:bg-red-500/20 transition"
                      onClick={() => void deleteCurrentProject()}
                      disabled={status.type === 'saving' || (!draft && selectedIndex < 0 && !isDraftRoute)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {status.type !== 'idle' ? (
                  <div
                    className={
                      'mt-3 rounded-xl px-3 py-2 text-sm ' +
                      (status.type === 'ok'
                        ? 'bg-primary/15 border border-primary/30 text-white'
                        : status.type === 'error'
                          ? 'bg-red-500/15 border border-red-500/30 text-white'
                          : 'bg-white/10 border border-white/10 text-white')
                    }
                  >
                    {status.message}
                  </div>
                ) : null}

                {!draft ? (
                  <div className="mt-4 text-white/70">Selecciona un proyecto o crea uno nuevo.</div>
                ) : (
                  <div className="mt-5 space-y-5">
                    {viewMode === 'project' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block">
                        <div className="text-white/70 text-sm mb-1">name (requerido)</div>
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                          value={draft.name || ''}
                          onChange={(e) => updateDraft({ name: e.target.value })}
                        />
                      </label>

                      <label className="block">
                        <div className="text-white/70 text-sm mb-1">displayName (opcional)</div>
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                          value={draft.displayName || ''}
                          onChange={(e) => updateDraft({ displayName: e.target.value })}
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <div className="text-white/70 text-sm mb-1">Slug (derivado)</div>
                        <div className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-mono">{selectedSlug || '(vacío)'}</div>
                      </label>

                      <label className="block md:col-span-2">
                        <div className="text-white/70 text-sm mb-1">image (ruta en /assets/...)</div>
                        <div className="space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <input
                              className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                              value={draft.image || ''}
                              onChange={(e) => updateDraft({ image: e.target.value })}
                              placeholder="/assets/img/projects/xxxx.png o https://..."
                            />
                            <button
                              type="button"
                              className="px-4 py-2 rounded-2xl bg-black/30 border border-white/10 text-white hover:bg-black/40 transition"
                              onClick={() => updateDraft({ image: '' })}
                            >
                              Sin logo
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => void (imagesOpen ? (setImagesOpen(false), Promise.resolve()) : openImages())}
                            >
                              {imagesOpen ? 'Cerrar imágenes' : 'Ver imágenes'}
                            </button>
                          </div>

                          {draft.image ? (
                            <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                              <div className="text-white/60 text-xs mb-2">Preview</div>
                              <div className="flex items-center gap-3">
                                <img
                                  src={draft.image}
                                  alt="project logo"
                                  className="h-14 w-14 rounded-xl bg-black/40 object-contain border border-white/10"
                                  loading="lazy"
                                />
                                <div className="text-white/70 text-xs font-mono break-all">{draft.image}</div>
                              </div>
                            </div>
                          ) : null}

                          {imagesOpen ? (
                            <div className="rounded-xl bg-black/20 border border-white/10 p-3 space-y-3">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div className="text-white font-semibold">Imágenes cargadas</div>
                                <div className="flex items-center gap-2">
                                  <button type="button" className="btn-primary" onClick={() => void loadImages()} disabled={imagesBusy}>
                                    {imagesBusy ? 'Cargando…' : 'Actualizar'}
                                  </button>
                                  <label className="btn-primary cursor-pointer">
                                    {uploadBusy ? 'Subiendo…' : 'Subir'}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) void uploadImageFile(f);
                                        e.currentTarget.value = '';
                                      }}
                                      disabled={uploadBusy}
                                    />
                                  </label>
                                </div>
                              </div>

                              {imagesError ? (
                                <div className="text-white text-sm bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2">{imagesError}</div>
                              ) : null}

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {images.map((img) => {
                                  const active = String(draft.image || '') === img.url;
                                  return (
                                    <button
                                      key={img.file}
                                      type="button"
                                      onClick={() => updateDraft({ image: img.url })}
                                      className={
                                        'rounded-xl border p-2 text-left transition ' +
                                        (active ? 'border-primary/40 bg-primary/10' : 'border-white/10 bg-black/20 hover:bg-black/30')
                                      }
                                      title={img.file}
                                    >
                                      <img src={img.url} alt={img.file} className="h-16 w-full rounded-lg bg-black/40 object-contain" loading="lazy" />
                                      <div className="mt-2 text-white/60 text-[11px] font-mono break-all">{img.file}</div>
                                    </button>
                                  );
                                })}
                                {!imagesBusy && !images.length ? <div className="text-white/60 text-sm">No hay imágenes en /assets/img/projects.</div> : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </label>

                      <label className="block md:col-span-2">
                        <div className="text-white/70 text-sm mb-1">link</div>
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                          value={draft.link || ''}
                          onChange={(e) => updateDraft({ link: e.target.value })}
                          placeholder="https://... o /project/slug"
                        />
                      </label>

                      <label className="block">
                        <div className="text-white/70 text-sm mb-1">demo</div>
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                          value={(draft.demo ?? '') as any}
                          onChange={(e) => updateDraft({ demo: e.target.value || null })}
                          placeholder="https://..."
                        />
                      </label>

                      <label className="block">
                        <div className="text-white/70 text-sm mb-1">github</div>
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                          value={(draft.github ?? '') as any}
                          onChange={(e) => updateDraft({ github: e.target.value || null })}
                          placeholder="https://github.com/..."
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <div className="text-white/70 text-sm mb-1">readme (URL o /projects-content/...)</div>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                            value={draft.readme || ''}
                            onChange={(e) => updateDraft({ readme: e.target.value })}
                            placeholder={`/projects-content/${selectedSlug || 'slug'}/${selectedSlug || 'slug'}.md`}
                          />
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => {
                              setViewMode('readme');
                              void createLocalReadme().then(() => void loadLocalReadmeText());
                            }}
                            disabled={!selectedSlug || status.type === 'saving'}
                          >
                            Crear README
                          </button>
                        </div>
                      </label>

                      <label className="block">
                        <div className="text-white/70 text-sm mb-1">directLink</div>
                        <select
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                          value={(() => {
                            const v = normalizeDirectLink(draft.directLink);
                            return v === null || v === undefined ? 'unset' : String(v);
                          })()}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === 'unset') updateDraft({ directLink: null });
                            else updateDraft({ directLink: normalizeDirectLink(v) ?? null });
                          }}
                        >
                          <option value="unset">(sin definir)</option>
                          <option value="false">false (página interna /project/...)</option>
                          <option value="true">true (link externo)</option>
                        </select>
                      </label>

                      <label className="block">
                        <div className="text-white/70 text-sm mb-1">Oculto</div>
                        <label className="inline-flex items-center gap-2 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white/80 text-sm">
                          <input
                            type="checkbox"
                            checked={Boolean(draft.hidden)}
                            onChange={(e) => updateDraft({ hidden: e.target.checked })}
                          />
                          No mostrar en la web (Projects)
                        </label>
                      </label>

                      <label className="block">
                        <div className="text-white/70 text-sm mb-1">Idioma descripción</div>
                        <select
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                          value={descLang}
                          onChange={(e) => setDescLang(e.target.value as SupportedLang)}
                        >
                          {SUPPORTED_LANGS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block md:col-span-2">
                        <div className="text-white/70 text-sm mb-1">description ({descLang})</div>
                        <textarea
                          className="w-full min-h-[100px] rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                          value={getLocalizedText(draft.description, descLang)}
                          onChange={(e) => updateDescription(descLang, e.target.value)}
                        />
                      </label>
                      </div>
                    ) : null}

                    {viewMode === 'tags' ? (
                      <div className="border-t border-white/10 pt-5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">Tags</h3>
                        </div>

                        <div className="mt-3 space-y-4">
                          <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                            <div className="text-white/70 text-sm mb-2">Tags asignados al proyecto</div>
                            <div className="flex flex-wrap gap-2">
                              {assignedTags.map((tg) => (
                                <button
                                  key={tagKey(tg.name)}
                                  type="button"
                                  onClick={() => setTagAssigned(tg.name, false)}
                                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/80 hover:bg-red-500/15 hover:border-red-500/30 transition"
                                  title="Quitar del proyecto"
                                >
                                  {tg.name}
                                </button>
                              ))}
                              {!assignedTags.length ? <div className="text-white/60 text-sm">Sin tags asignados.</div> : null}
                            </div>
                          </div>

                          <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                            <div className="text-white/70 text-sm mb-2">Sugeridos</div>
                            <div className="flex flex-wrap gap-2">
                              {suggestedTags.map((t) => {
                                const isAssigned = assignedByKey.has(t.key);
                                return (
                                  <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTagAssigned(t.name, !isAssigned)}
                                    className={
                                      'px-3 py-1.5 rounded-xl border text-sm transition ' +
                                      (isAssigned ? 'bg-primary/15 border-primary/40 text-white' : 'bg-black/20 border-white/10 text-white/80 hover:bg-black/30')
                                    }
                                    title={t.count ? `Usado en ${t.count} proyectos` : ''}
                                  >
                                    {t.name}
                                  </button>
                                );
                              })}
                              {!suggestedTags.length ? <div className="text-white/60 text-sm">No hay sugeridos todavía.</div> : null}
                            </div>
                          </div>

                          <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                              <div>
                                <div className="text-white font-semibold">Pool de tags (global)</div>
                                <div className="text-white/60 text-xs">Crea un tag global y asígnalo al proyecto, o marca/desmarca.</div>
                              </div>

                              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                                <input
                                  className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                                  value={newTagName}
                                  onChange={(e) => setNewTagName(e.target.value)}
                                  placeholder="Nuevo tag (ej: Backend)"
                                />
                                <label className="inline-flex items-center gap-2 text-white/80 text-sm px-3 py-2 rounded-xl bg-black/20 border border-white/10">
                                  <input type="checkbox" checked={newTagReadable} onChange={(e) => setNewTagReadable(e.target.checked)} />
                                  readable
                                </label>
                                <button type="button" className="btn-primary" onClick={createTagAndAssign} disabled={!String(newTagName).trim()}>
                                  Crear + asignar
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {tagCatalog.map((t) => {
                                const assigned = assignedByKey.has(t.key);
                                const readable = assigned ? Boolean(assignedByKey.get(t.key)?.readable) : true;
                                const inCustomPool = customPoolKeys.has(t.key);
                                return (
                                  <div key={t.key} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 border border-white/10 px-3 py-2">
                                    <label className="inline-flex items-center gap-2 text-white/80 text-sm min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={assigned}
                                        onChange={(e) => setTagAssigned(t.name, e.target.checked)}
                                      />
                                      <span className="truncate">{t.name}</span>
                                      <span className="text-white/40 text-xs">{t.count}</span>
                                    </label>

                                    <div className="flex items-center gap-3">
                                      <label className={'inline-flex items-center gap-2 text-xs ' + (assigned ? 'text-white/70' : 'text-white/30')}>
                                        <input
                                          type="checkbox"
                                          checked={readable}
                                          disabled={!assigned}
                                          onChange={(e) => setTagReadable(t.name, e.target.checked)}
                                        />
                                        readable
                                      </label>

                                      {inCustomPool ? (
                                        <button
                                          type="button"
                                          className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-red-500/15 hover:border-red-500/30 transition text-xs"
                                          onClick={() => removeFromCustomPool(t.name)}
                                          title="Eliminar del pool global (no quita de proyectos)"
                                        >
                                          Eliminar
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                              {!tagCatalog.length ? <div className="text-white/60 text-sm">No hay tags todavía.</div> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {viewMode === 'readme' ? (
                      <div className="border-t border-white/10 pt-5 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-white">README</h3>
                            <div className="text-white/60 text-xs">Usa un README del repo, crea uno local, o edítalo si está en <span className="font-mono">/projects-content</span>.</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" className="btn-primary" onClick={setRepoReadmeUrl} disabled={!String(draft.github || '').trim()}>
                              Usar README repo
                            </button>
                            <button type="button" className="btn-primary" onClick={() => void createLocalReadme().then(() => void loadLocalReadmeText())} disabled={!selectedSlug || status.type === 'saving'}>
                              Crear local
                            </button>
                            <label className="btn-primary cursor-pointer">
                              Subir .md
                              <input
                                type="file"
                                accept=".md,text/markdown"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void uploadReadmeFile(f);
                                  e.currentTarget.value = '';
                                }}
                              />
                            </label>
                            <button type="button" className="btn-primary" onClick={() => void loadLocalReadmeText()} disabled={!String(draft.readme || '').trim() || readmeLoading}>
                              {readmeLoading ? 'Cargando…' : 'Cargar'}
                            </button>
                            <button type="button" className="btn-primary" onClick={() => void saveLocalReadmeText()} disabled={!canEditLocalReadme || readmeStatus.type === 'saving'}>
                              Guardar README
                            </button>
                            <button type="button" className="btn-primary" onClick={() => void deleteLocalReadme()} disabled={!selectedSlug || readmeStatus.type === 'saving'}>
                              Eliminar local
                            </button>
                            <button type="button" className="btn-primary" onClick={clearReadme} disabled={readmeStatus.type === 'saving'}>
                              Sin README
                            </button>
                          </div>
                        </div>

                        {readmeStatus.type !== 'idle' ? (
                          <div
                            className={
                              'rounded-xl px-3 py-2 text-sm ' +
                              (readmeStatus.type === 'ok'
                                ? 'bg-primary/15 border border-primary/30 text-white'
                                : readmeStatus.type === 'error'
                                  ? 'bg-red-500/15 border border-red-500/30 text-white'
                                  : 'bg-white/10 border border-white/10 text-white')
                            }
                          >
                            {readmeStatus.message}
                          </div>
                        ) : null}

                        <label className="block">
                          <div className="text-white/70 text-sm mb-1">readme (URL o /projects-content/...)</div>
                          <input
                            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                            value={draft.readme || ''}
                            onChange={(e) => updateDraft({ readme: e.target.value })}
                            placeholder={`/projects-content/${selectedSlug || 'slug'}/${selectedSlug || 'slug'}.md`}
                          />
                          {String(draft.readme || '').trim() ? (
                            <div className="mt-2 text-white/60 text-xs">
                              Preview: <a className="underline" href={draft.readme} target="_blank" rel="noreferrer">{draft.readme}</a>
                            </div>
                          ) : null}
                        </label>

                        <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                          <div className="text-white/70 text-sm mb-2">Markdown + Preview</div>

                          {!canEditLocalReadme ? (
                            <div className="text-white/60 text-sm">
                              Para editar aquí, usa un path local tipo <span className="font-mono">/projects-content/&lt;slug&gt;/&lt;slug&gt;.md</span>. (La preview sí puede cargar URLs remotas.)
                            </div>
                          ) : null}

                          {canEditLocalReadme ? (
                            <div className="mt-3 rounded border border-white/10 bg-black/20 p-3">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div>
                                  <div className="text-white/60 text-xs mb-2">Encabezados</div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeLinePrefix('# ')}>
                                      H1
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeLinePrefix('## ')}>
                                      H2
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeLinePrefix('### ')}>
                                      H3
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeLinePrefix('#### ')}>
                                      H4
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-white/60 text-xs mb-2">Formato</div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" className={mdSmallBtn} onClick={() => applyReadmeInsert('**', '**')}>
                                      Bold
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => applyReadmeInsert('*', '*')}>
                                      Italic
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => applyReadmeInsert('~~', '~~')}>
                                      Strike
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => applyReadmeInsert('`', '`')}>
                                      Inline code
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeLinePrefix('> ')}>
                                      Quote
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-white/60 text-xs mb-2">Listas</div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeLinePrefix('- ')}>
                                      Bullet
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeLinePrefix('1. ')}>
                                      Numbered
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeLinePrefix('- [ ] ')}>
                                      Todo
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-white/60 text-xs mb-2">Alineación</div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeAlignBlock('left')}>
                                      Left
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeAlignBlock('center')}>
                                      Center
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => insertReadmeAlignBlock('right')}>
                                      Right
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-white/60 text-xs mb-2">Tabla</div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <select
                                      className={mdSmallField}
                                      value={readmeTableSize}
                                      onChange={(e) => setReadmeTableSize(e.target.value as '2x2' | '3x3' | '4x4')}
                                    >
                                      <option value="2x2">2x2</option>
                                      <option value="3x3">3x3</option>
                                      <option value="4x4">4x4</option>
                                    </select>
                                    <button
                                      type="button"
                                      className={mdSmallBtn}
                                      onClick={() => {
                                        const [c, r] = String(readmeTableSize).split('x').map((n) => Number(n));
                                        insertReadmeTable(c || 2, r || 2);
                                      }}
                                    >
                                      Insert table
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-white/60 text-xs mb-2">Código</div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <select className={mdSmallField} value={readmeCodeLang} onChange={(e) => setReadmeCodeLang(e.target.value as typeof readmeCodeLang)}>
                                      <option value="tsx">tsx</option>
                                      <option value="ts">ts</option>
                                      <option value="jsx">jsx</option>
                                      <option value="js">js</option>
                                      <option value="json">json</option>
                                      <option value="bash">bash</option>
                                      <option value="sh">sh</option>
                                      <option value="powershell">powershell</option>
                                      <option value="python">python</option>
                                      <option value="java">java</option>
                                      <option value="c">c</option>
                                      <option value="cpp">cpp</option>
                                      <option value="go">go</option>
                                      <option value="rust">rust</option>
                                      <option value="sql">sql</option>
                                      <option value="yaml">yaml</option>
                                      <option value="toml">toml</option>
                                      <option value="dockerfile">dockerfile</option>
                                      <option value="css">css</option>
                                      <option value="html">html</option>
                                      <option value="md">md</option>
                                      <option value="txt">txt</option>
                                      <option value="">(none)</option>
                                    </select>
                                    <button type="button" className={mdSmallBtn} onClick={insertReadmeCodeBlock}>
                                      Insert codeblock
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-white/60 text-xs mb-2">Link</div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" className={mdSmallBtn} onClick={() => applyReadmeInsert('[', '](https://example.com)')}>
                                      Insert link
                                    </button>
                                  </div>
                                </div>

                                <div className="lg:col-span-2">
                                  <div className="text-white/60 text-xs mb-2">Imagen</div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <select
                                      className={mdSmallField}
                                      value={readmeImageLayout}
                                      onChange={(e) => setReadmeImageLayout(e.target.value as MdImageLayout)}
                                      title="Layout"
                                    >
                                      <option value="inline">inline</option>
                                      <option value="center">center</option>
                                      <option value="left">left</option>
                                      <option value="right">right</option>
                                    </select>
                                    <select
                                      className={mdSmallField}
                                      value={readmeImageType}
                                      onChange={(e) => setReadmeImageType(e.target.value as MdImageInsertType)}
                                      title="Type"
                                    >
                                      <option value="simple">simple</option>
                                      <option value="caption">caption</option>
                                      <option value="dimensions">dimensions</option>
                                    </select>
                                    <input
                                      className={mdSmallField}
                                      value={readmeImageAlt}
                                      onChange={(e) => setReadmeImageAlt(e.target.value)}
                                      placeholder="alt"
                                      title="Alt"
                                    />
                                    <input
                                      className={mdSmallField}
                                      value={readmeImageWidth}
                                      onChange={(e) => setReadmeImageWidth(e.target.value)}
                                      placeholder="width"
                                      title="Width"
                                      inputMode="numeric"
                                    />
                                    <input
                                      className={mdSmallField}
                                      value={readmeImageHeight}
                                      onChange={(e) => setReadmeImageHeight(e.target.value)}
                                      placeholder="height"
                                      title="Height"
                                      inputMode="numeric"
                                      disabled={readmeImageType !== 'dimensions'}
                                    />
                                    <button type="button" className={mdSmallBtn} onClick={insertReadmeImageSample}>
                                      Insert sample
                                    </button>
                                    <button
                                      type="button"
                                      className={mdSmallBtn}
                                      onClick={() => {
                                        setReadmeLogosOpen((v) => {
                                          const next = !v;
                                          if (next && !imagesBusy && images.length === 0) void loadImages();
                                          return next;
                                        });
                                      }}
                                    >
                                      {readmeLogosOpen ? 'Ocultar imágenes' : 'Mostrar imágenes'}
                                    </button>
                                    <button type="button" className={mdSmallBtn} onClick={() => void loadImages()} disabled={imagesBusy}>
                                      {imagesBusy ? 'Cargando…' : 'Recargar'}
                                    </button>
                                    <label className={mdSmallBtn + ' cursor-pointer'}>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0] || null;
                                          void uploadLogoToGlobalPool(f);
                                          if (e.currentTarget) e.currentTarget.value = '';
                                        }}
                                        disabled={readmeLogoUploadBusy}
                                      />
                                      {readmeLogoUploadBusy ? 'Subiendo…' : 'Subir imagen'}
                                    </label>
                                  </div>
                                  <div className="mt-2 text-white/40 text-xs">
                                    Tip: click en una imagen de abajo inserta según estas opciones.
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <div className={canEditLocalReadme ? 'grid grid-cols-1 xl:grid-cols-2 gap-3' : ''}>
                            {canEditLocalReadme ? (
                              <div className="rounded border border-white/10 bg-black/20 p-3">
                                <textarea
                                  ref={readmeTextareaRef}
                                  className="w-full min-h-[560px] rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-mono text-sm"
                                  value={readmeText}
                                  onChange={(e) => {
                                    setReadmeText(e.target.value);
                                    setReadmeStatus({ type: 'idle' });
                                  }}
                                  placeholder="# README\n"
                                />

                                <div className="mt-3 rounded border border-white/10 bg-black/20 p-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-white/60 text-xs">Imágenes cargadas: <span className="font-mono">public/**</span></div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <button type="button" className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:bg-black/30 transition text-xs" onClick={() => setReadmeLogosOpen((v) => !v)}>
                                        {readmeLogosOpen ? 'Ocultar' : 'Mostrar'}
                                      </button>
                                    </div>
                                  </div>

                                  {readmeLogosError ? <div className="mt-2 text-xs text-red-200">{readmeLogosError}</div> : null}

                                  {readmeLogosOpen ? (
                                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                      {images.map((img) => (
                                        <button
                                          key={img.file}
                                          type="button"
                                          className="rounded-lg border border-white/10 bg-black/20 hover:bg-white/5 transition p-2 text-left"
                                          onClick={() => {
                                            const url = String(img.url || '');
                                            if (!url) return;

                                            const base = url.split('/').pop()?.replace(/\.[^.]+$/, '') || 'image';
                                            if (!readmeImageAlt.trim() || readmeImageAlt.trim() === 'alt text') setReadmeImageAlt(base);

                                            void copyToClipboard(url);
                                            insertReadmeImageWithUrl(url);
                                          }}
                                          title={img.file}
                                        >
                                          <img
                                            src={publicPath(img.url)}
                                            alt={img.file}
                                            className="h-12 w-full object-contain bg-black/30 rounded"
                                            loading="lazy"
                                          />
                                          <div className="mt-1 text-[10px] text-white/50 truncate">{img.file}</div>
                                        </button>
                                      ))}
                                      {!imagesBusy && !images.length ? <div className="text-white/50 text-xs">No hay imágenes.</div> : null}
                                    </div>
                                  ) : null}
                                  <div className="mt-2 text-white/40 text-xs">Click en una imagen: copia URL + inserta en el markdown.</div>
                                </div>
                              </div>
                            ) : null}

                            <div className={canEditLocalReadme ? 'rounded border border-white/10 bg-black/20 p-3' : 'rounded border border-white/10 bg-black/20 p-3'}>
                              <div className="text-white/70 text-sm mb-2">Preview</div>
                              <div className="prose prose-invert max-w-none">
                                <BlogMarkdown markdown={readmeText || ''} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="text-white/60 text-xs">
                      Nota: esto solo funciona en <span className="font-mono">npm run dev</span> (usa endpoints <span className="font-mono">/__dev/projects-editor/*</span>).
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        <div className="mt-8 text-white/40 text-xs" />
      </div>
    </div>
  );
}
