import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import fs from 'node:fs/promises'
import path from 'node:path'

type ImageAsset = { file: string; url: string };

const IMAGE_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.avif',
  '.bmp',
  '.ico',
  '.tif',
  '.tiff',
  '.jfif',
]);

async function listImageAssetsRecursive(absDir: string, urlBase: string): Promise<ImageAsset[]> {
  const out: ImageAsset[] = [];

  const walk = async (dir: string) => {
    let entries: any[] = [];
    try {
      entries = (await fs.readdir(dir, { withFileTypes: true })) as any;
    } catch {
      entries = [];
    }

    for (const ent of entries) {
      const name = String(ent?.name || '').trim();
      if (!name || name.startsWith('.')) continue;

      const full = path.join(dir, name);
      if (ent?.isDirectory?.()) {
        await walk(full);
        continue;
      }
      if (!ent?.isFile?.()) continue;

      const ext = path.extname(name).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) continue;

      const rel = path.relative(absDir, full).split(path.sep).join('/');
      if (!rel) continue;
      out.push({ file: rel, url: `${urlBase}/${rel}` });
    }
  };

  await walk(absDir);
  out.sort((a, b) => a.file.localeCompare(b.file));
  return out;
}

function devProjectsEditorPlugin(): Plugin {
  return {
    name: 'dev-projects-editor-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = String(req.url || '').split('?')[0];

        // GET: list available images in public/** (recursive)
        if (req.method === 'GET' && url === '/__dev/projects-editor/list-images') {
          try {
            const root = process.cwd();
            const publicDir = path.join(root, 'public');

            const images = await listImageAssetsRecursive(publicDir, '');

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, images }));
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
            return;
          }
        }

        if (
          req.method !== 'POST' ||
          (url !== '/__dev/projects-editor/save' &&
            url !== '/__dev/projects-editor/create-readme' &&
            url !== '/__dev/projects-editor/save-readme' &&
            url !== '/__dev/projects-editor/delete-readme' &&
            url !== '/__dev/projects-editor/upload-image')
        ) {
          return next();
        }

        try {
          let raw = '';
          req.on('data', (chunk: any) => {
            raw += chunk;
          });
          req.on('end', async () => {
            const body = raw ? JSON.parse(raw) : {};

            const root = process.cwd();
            const publicDir = path.join(root, 'public');

            if (url === '/__dev/projects-editor/upload-image') {
              const fileNameRaw = String(body?.fileName || '').trim();
              const dataUrl = String(body?.dataUrl || '').trim();

              if (!fileNameRaw || !dataUrl) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Missing fileName or dataUrl' }));
                return;
              }

              const safeName = fileNameRaw
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9._-]/g, '')
                .replace(/-+/g, '-')
                .replace(/(^-|-$)/g, '')
                .slice(0, 80);

              const ext = path.extname(safeName).toLowerCase();
              if (!IMAGE_EXTS.has(ext)) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: `Unsupported file extension: ${ext || '(none)'}` }));
                return;
              }

              const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (!m) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Invalid dataUrl (expected data:*/*;base64,...)' }));
                return;
              }

              const imgDir = path.join(publicDir, 'assets', 'img', 'projects');
              await fs.mkdir(imgDir, { recursive: true });

              const base = path.basename(safeName, ext) || 'image';
              let outName = `${base}${ext}`;
              let outPath = path.join(imgDir, outName);
              for (let i = 2; i < 50; i++) {
                try {
                  await fs.stat(outPath);
                  outName = `${base}-${i}${ext}`;
                  outPath = path.join(imgDir, outName);
                } catch {
                  break;
                }
              }

              const buf = Buffer.from(m[2], 'base64');
              await fs.writeFile(outPath, buf);

              const wrote = `public/assets/img/projects/${outName}`;
              const urlOut = `/assets/img/projects/${outName}`;

              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: true, url: urlOut, wrote }));
              return;
            }

            if (url === '/__dev/projects-editor/create-readme') {
              const slug = String(body?.slug || '').trim();
              const overwrite = Boolean(body?.overwrite);
              const content = typeof body?.content === 'string' ? body.content : '';

              if (!slug) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Missing slug' }));
                return;
              }

              if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Invalid slug format' }));
                return;
              }

              const dir = path.join(publicDir, 'projects-content', slug);
              const outFile = path.join(dir, `${slug}.md`);

              await fs.mkdir(dir, { recursive: true });
              if (!overwrite) {
                try {
                  await fs.stat(outFile);
                  res.statusCode = 409;
                  res.setHeader('content-type', 'application/json');
                  res.end(JSON.stringify({ ok: false, error: 'README already exists', slug }));
                  return;
                } catch {
                  // file does not exist
                }
              }

              const fallback = `# ${slug}\n\nDescribe tu proyecto aquí.\n`;
              await fs.writeFile(outFile, (content || fallback), 'utf8');

              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: true, wrote: `public/projects-content/${slug}/${slug}.md`, url: `/projects-content/${slug}/${slug}.md`, slug }));
              return;
            }

            if (url === '/__dev/projects-editor/save-readme') {
              const slug = String(body?.slug || '').trim();
              const content = typeof body?.content === 'string' ? body.content : '';

              if (!slug) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Missing slug' }));
                return;
              }

              if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Invalid slug format' }));
                return;
              }

              const dir = path.join(publicDir, 'projects-content', slug);
              const outFile = path.join(dir, `${slug}.md`);

              await fs.mkdir(dir, { recursive: true });
              await fs.writeFile(outFile, content, 'utf8');

              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: true, wrote: `public/projects-content/${slug}/${slug}.md`, url: `/projects-content/${slug}/${slug}.md`, slug }));
              return;
            }

            if (url === '/__dev/projects-editor/delete-readme') {
              const slug = String(body?.slug || '').trim();

              if (!slug) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Missing slug' }));
                return;
              }

              if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Invalid slug format' }));
                return;
              }

              const outFile = path.join(publicDir, 'projects-content', slug, `${slug}.md`);

              let deleted = false;
              try {
                await fs.unlink(outFile);
                deleted = true;
              } catch (e: any) {
                if (e?.code !== 'ENOENT') throw e;
              }

              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: true, deleted, wrote: `public/projects-content/${slug}/${slug}.md`, slug }));
              return;
            }

            // Save JSON
            const projects = body?.projects;
            if (!Array.isArray(projects)) {
              res.statusCode = 400;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Body.projects must be an array' }));
              return;
            }

            const normalizeDirectLink = (v: any): boolean | null | undefined => {
              if (v === null || v === undefined) return v;
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
            };

            const normalized = projects
              .filter((p: any) => p && typeof p === 'object')
              .map((p: any) => ({
                ...p,
                name: String(p?.name || '').trim(),
                displayName: p?.displayName === undefined ? undefined : String(p.displayName),
                image: p?.image === undefined ? undefined : String(p.image),
                link: p?.link === undefined ? undefined : String(p.link),
                demo: p?.demo === undefined ? undefined : p.demo,
                github: p?.github === undefined ? undefined : p.github,
                readme: p?.readme === undefined ? undefined : String(p.readme),
                directLink: normalizeDirectLink(p?.directLink) ?? null,
                hidden: Boolean(p?.hidden),
                tags: Array.isArray(p?.tags)
                  ? p.tags
                      .filter((t: any) => t && typeof t === 'object')
                      .map((t: any) => ({
                        name: String(t?.name || '').trim(),
                        readable: Boolean(t?.readable),
                      }))
                      .filter((t: any) => !!t.name)
                  : [],
              }))
              .filter((p: any) => !!p.name);

            const jsonPath = path.join(publicDir, 'jsons', 'projects-real.json');
            await fs.writeFile(jsonPath, JSON.stringify(normalized, null, 2) + '\n', 'utf8');

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, json: 'public/jsons/projects-real.json', count: normalized.length }));
          });
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
        }
      });
    },
  }
}

function devBlogEditorPlugin(): Plugin {
  return {
    name: 'dev-blog-editor-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = String(req.url || '').split('?')[0];

        // GET: list available global logos in public/assets/img/projects
        if (req.method === 'GET' && url === '/__dev/blog-editor/list-logos') {
          try {
            const root = process.cwd();
            const publicDir = path.join(root, 'public');
            const imgDir = path.join(publicDir, 'assets', 'img', 'projects');

            const images = await listImageAssetsRecursive(imgDir, '/assets/img/projects');

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, images }));
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
            return;
          }
        }

        // GET: list all images inside public/** (recursive)
        if (req.method === 'GET' && url === '/__dev/blog-editor/list-asset-images') {
          try {
            const root = process.cwd();
            const publicDir = path.join(root, 'public');

            const images = await listImageAssetsRecursive(publicDir, '');

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, images }));
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
            return;
          }
        }

        if (
          req.method !== 'POST' ||
          (url !== '/__dev/blog-editor/save' &&
            url !== '/__dev/blog-editor/upload-image' &&
            url !== '/__dev/blog-editor/upload-logo' &&
            url !== '/__dev/blog-editor/delete-post')
        )
          return next();

        try {
          let raw = '';
          req.on('data', (chunk: any) => {
            raw += chunk;
          });
          req.on('end', async () => {
            const body = raw ? JSON.parse(raw) : {};

            if (url === '/__dev/blog-editor/delete-post') {
              const slug = String(body?.slug || body?.id || '').trim();
              if (!slug) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Missing slug' }));
                return;
              }

              if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Invalid slug format' }));
                return;
              }

              const root = process.cwd();
              const publicDir = path.join(root, 'public');
              const jsonPath = path.join(publicDir, 'jsons', 'blogPosts.json');

              let posts: any[] = [];
              try {
                const rawPosts = await fs.readFile(jsonPath, 'utf8');
                const parsed = JSON.parse(rawPosts);
                posts = Array.isArray(parsed) ? parsed : [];
              } catch {
                posts = [];
              }

              const match = posts.find((p) => p?.slug === slug || p?.id === slug);
              const next = posts.filter((p) => !(p?.slug === slug || p?.id === slug));
              const removed = posts.length - next.length;

              if (!removed) {
                res.statusCode = 404;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Post not found in blogPosts.json', slug }));
                return;
              }

              await fs.writeFile(jsonPath, JSON.stringify(next, null, 4) + '\n', 'utf8');

              // Best-effort: delete markdown folder
              const date = String(match?.date || '').trim();
              const dt = new Date(date);
              const year = String(match?.year || (Number.isNaN(dt.getTime()) ? '' : dt.getFullYear()));
              const monthRaw = String(match?.month || (Number.isNaN(dt.getTime()) ? '' : dt.getMonth() + 1));
              const month = monthRaw ? String(Number(monthRaw)).padStart(2, '0') : '';

              let deletedDir = false;
              let blogDir = '';
              if (year && month) {
                blogDir = path.join(publicDir, 'blog-content', year, month, slug);
                try {
                  await fs.rm(blogDir, { recursive: true, force: true });
                  deletedDir = true;
                } catch {
                  deletedDir = false;
                }
              }

              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.end(
                JSON.stringify({
                  ok: true,
                  slug,
                  removed,
                  json: 'public/jsons/blogPosts.json',
                  deletedDir,
                  blogDir: blogDir ? blogDir.replace(root, '').replace(/^\\/, '').replace(/\\/g, '/') : null,
                })
              );
              return;
            }

            if (url === '/__dev/blog-editor/upload-logo') {
              const fileNameRaw = String(body?.fileName || '').trim();
              const dataUrl = String(body?.dataUrl || '').trim();

              if (!fileNameRaw || !dataUrl) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Missing fileName or dataUrl' }));
                return;
              }

              const safeName = fileNameRaw
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9._-]/g, '')
                .replace(/-+/g, '-')
                .replace(/(^-|-$)/g, '')
                .slice(0, 80);

              const ext = path.extname(safeName).toLowerCase();
              if (!IMAGE_EXTS.has(ext)) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: `Unsupported file extension: ${ext || '(none)'}` }));
                return;
              }

              const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (!m) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Invalid dataUrl (expected data:*/*;base64,...)' }));
                return;
              }

              const root = process.cwd();
              const publicDir = path.join(root, 'public');
              const imgDir = path.join(publicDir, 'assets', 'img', 'projects');
              await fs.mkdir(imgDir, { recursive: true });

              const base = path.basename(safeName, ext) || 'image';
              let outName = `${base}${ext}`;
              let outPath = path.join(imgDir, outName);
              for (let i = 2; i < 50; i++) {
                try {
                  await fs.stat(outPath);
                  outName = `${base}-${i}${ext}`;
                  outPath = path.join(imgDir, outName);
                } catch {
                  break;
                }
              }

              const buf = Buffer.from(m[2], 'base64');
              await fs.writeFile(outPath, buf);

              const wrote = `public/assets/img/projects/${outName}`;
              const urlOut = `/assets/img/projects/${outName}`;

              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: true, url: urlOut, wrote }));
              return;
            }

            const meta = body?.meta;

            const slug = String(meta?.slug || meta?.id || '').trim();
            const date = String(meta?.date || '').trim();
            if (!slug) {
              res.statusCode = 400;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Missing meta.slug' }));
              return;
            }

            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
              res.statusCode = 400;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Invalid slug format' }));
              return;
            }

            const dt = new Date(date);
            const year = String(meta?.year || (Number.isNaN(dt.getTime()) ? '' : dt.getFullYear()));
            const monthRaw = String(meta?.month || (Number.isNaN(dt.getTime()) ? '' : dt.getMonth() + 1));
            const month = monthRaw ? String(Number(monthRaw)).padStart(2, '0') : '';
            if (!year || !month) {
              res.statusCode = 400;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Missing or invalid meta.date (cannot derive year/month)' }));
              return;
            }

            const root = process.cwd();
            const publicDir = path.join(root, 'public');
            const blogDir = path.join(publicDir, 'blog-content', year, month, slug);

            if (req.url === '/__dev/blog-editor/upload-image') {
              const fileNameRaw = String(body?.fileName || '').trim();
              const dataUrl = String(body?.dataUrl || '').trim();

              if (!fileNameRaw || !dataUrl) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Missing fileName or dataUrl' }));
                return;
              }

              const safeName = fileNameRaw
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9._-]/g, '')
                .replace(/-+/g, '-')
                .replace(/(^-|-$)/g, '')
                .slice(0, 80);

              const ext = path.extname(safeName).toLowerCase();
              const allowed = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
              if (!allowed.has(ext)) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: `Unsupported file extension: ${ext || '(none)'}` }));
                return;
              }

              const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (!m) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Invalid dataUrl (expected data:*/*;base64,...)' }));
                return;
              }

              const imgDir = path.join(blogDir, 'img');
              await fs.mkdir(imgDir, { recursive: true });

              const base = path.basename(safeName, ext) || 'image';
              let outName = `${base}${ext}`;
              let outPath = path.join(imgDir, outName);
              for (let i = 2; i < 50; i++) {
                try {
                  await fs.stat(outPath);
                  outName = `${base}-${i}${ext}`;
                  outPath = path.join(imgDir, outName);
                } catch {
                  break;
                }
              }

              const buf = Buffer.from(m[2], 'base64');
              await fs.writeFile(outPath, buf);

              const publicPath = `public/blog-content/${year}/${month}/${slug}/img/${outName}`;
              const url = `/blog-content/${year}/${month}/${slug}/img/${outName}`;

              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: true, url, wrote: publicPath, slug, year, month }));
              return;
            }

            const markdownByLang = body?.markdownByLang;

            const allowedLangs = new Set(['en', 'es', 'ja', 'fr', 'de', 'pt', 'pl', 'ru', 'zh', 'ko', 'th', 'fil']);
            const langs = Array.isArray(meta?.languages) ? meta.languages.map((l: any) => String(l).trim().toLowerCase()) : [];
            const languages = langs.filter((l: string) => allowedLangs.has(l));
            const defaultLanguage = String(meta?.defaultLanguage || languages[0] || 'en').trim().toLowerCase();
            const jsonPath = path.join(publicDir, 'jsons', 'blogPosts.json');

            const writeResults: string[] = [];
            await fs.mkdir(blogDir, { recursive: true });

            const mdMap = (markdownByLang && typeof markdownByLang === 'object') ? markdownByLang : {};
            for (const lang of (languages.length ? languages : [defaultLanguage])) {
              const content = typeof mdMap[lang] === 'string' ? mdMap[lang] : '';
              const outFile = path.join(blogDir, `${lang}.md`);
              await fs.writeFile(outFile, content, 'utf8');
              writeResults.push(`public/blog-content/${year}/${month}/${slug}/${lang}.md`);
            }

            // Upsert blogPosts.json
            let posts: any[] = [];
            try {
              const rawPosts = await fs.readFile(jsonPath, 'utf8');
              const parsed = JSON.parse(rawPosts);
              posts = Array.isArray(parsed) ? parsed : [];
            } catch {
              posts = [];
            }

            const nextMeta = {
              ...meta,
              id: slug,
              slug,
              year,
              month,
              languages: (languages.length ? languages : [defaultLanguage]),
              defaultLanguage: allowedLangs.has(defaultLanguage) ? defaultLanguage : 'en',
            };

            const idx = posts.findIndex((p) => p?.slug === slug || p?.id === slug);
            if (idx >= 0) {
              const existing = posts[idx] || {};
              // Merge: keep existing fields if omitted by nextMeta
              posts[idx] = { ...existing, ...nextMeta };
            } else {
              posts.push(nextMeta);
            }

            posts.sort((a, b) => {
              const at = new Date(a?.date || 0).getTime();
              const bt = new Date(b?.date || 0).getTime();
              return bt - at;
            });

            await fs.writeFile(jsonPath, JSON.stringify(posts, null, 4) + '\n', 'utf8');

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, wrote: writeResults, json: 'public/jsons/blogPosts.json', slug }));
          });
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
        }
      });
    },
  }
}

function devTagsManagerPlugin(): Plugin {
  return {
    name: 'dev-tags-manager',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = String(req.url || '').split('?')[0];
        if (req.method !== 'POST' || (url !== '/__dev/tags-manager/projects/remove-tag' && url !== '/__dev/tags-manager/blog/remove-tag')) return next();

        try {
          let raw = '';
          req.on('data', (chunk: any) => {
            raw += chunk;
          });
          req.on('end', async () => {
            const body = raw ? JSON.parse(raw) : {};
            const name = String(body?.name || body?.tag || '').trim();
            if (!name) {
              res.statusCode = 400;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Missing name' }));
              return;
            }

            const key = name.toLowerCase();
            const root = process.cwd();
            const publicDir = path.join(root, 'public');

            if (url === '/__dev/tags-manager/projects/remove-tag') {
              const jsonPath = path.join(publicDir, 'jsons', 'projects-real.json');
              let projects: any[] = [];
              try {
                const rawProjects = await fs.readFile(jsonPath, 'utf8');
                const parsed = JSON.parse(rawProjects);
                projects = Array.isArray(parsed) ? parsed : [];
              } catch {
                projects = [];
              }

              let removedFrom = 0;
              const next = projects.map((p) => {
                const tags = Array.isArray(p?.tags) ? p.tags : [];
                const filtered = tags.filter((t: any) => {
                  const tn = String(t?.name || '').trim();
                  if (!tn) return false;
                  return tn.toLowerCase() !== key;
                });
                if (filtered.length !== tags.length) removedFrom += 1;
                return { ...p, tags: filtered };
              });

              await fs.writeFile(jsonPath, JSON.stringify(next, null, 2) + '\n', 'utf8');

              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: true, removedFrom, json: 'public/jsons/projects-real.json', name }));
              return;
            }

            // Blog
            const jsonPath = path.join(publicDir, 'jsons', 'blogPosts.json');
            let posts: any[] = [];
            try {
              const rawPosts = await fs.readFile(jsonPath, 'utf8');
              const parsed = JSON.parse(rawPosts);
              posts = Array.isArray(parsed) ? parsed : [];
            } catch {
              posts = [];
            }

            let removedFrom = 0;
            const next = posts.map((p) => {
              const tags = Array.isArray(p?.tags) ? p.tags : [];
              const filtered = tags.filter((t: any) => {
                const tn = String(t || '').trim();
                if (!tn) return false;
                return tn.toLowerCase() !== key;
              });
              if (filtered.length !== tags.length) removedFrom += 1;
              return { ...p, tags: filtered };
            });

            await fs.writeFile(jsonPath, JSON.stringify(next, null, 4) + '\n', 'utf8');

            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, removedFrom, json: 'public/jsons/blogPosts.json', name }));
          });
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawBase = String(env.VITE_BASE || '/');
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  return {
    base,
    plugins: [react(), devBlogEditorPlugin(), devProjectsEditorPlugin(), devTagsManagerPlugin()],
    publicDir: 'public',
    server: {
      port: 5177,
      fs: {
        strict: false,
      },
    },
    assetsInclude: ['**/*.md'],
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          en: resolve(__dirname, 'en/index.html'),
          es: resolve(__dirname, 'es/index.html'),
          ja: resolve(__dirname, 'ja/index.html'),
          fr: resolve(__dirname, 'fr/index.html'),
          de: resolve(__dirname, 'de/index.html'),
          pt: resolve(__dirname, 'pt/index.html'),
          pl: resolve(__dirname, 'pl/index.html'),
          ru: resolve(__dirname, 'ru/index.html'),
          zh: resolve(__dirname, 'zh/index.html'),
          ko: resolve(__dirname, 'ko/index.html'),
          th: resolve(__dirname, 'th/index.html'),
          fil: resolve(__dirname, 'fil/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@pages': '/src/pages',
        '@styles': '/src/styles',
        '@i18n': '/src/i18n',
        '@locales': '/src/locales',
        buffer: 'buffer',
      },
    },
    define: {
      global: {},
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
  };
});
