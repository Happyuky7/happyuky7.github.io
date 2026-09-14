import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { projectSlug, matchesProjectSlug } from "../src/utils/projectSlug.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const ENTRY_PAGES = [
  "index.html",
  "en/index.html",
  "es/index.html",
  "ja/index.html",
  "fr/index.html",
  "de/index.html",
  "pt/index.html",
  "pl/index.html",
  "ru/index.html",
  "zh/index.html",
  "ko/index.html",
  "th/index.html",
  "fil/index.html",
  "blog/index.html",
  "projects/index.html",
  "contact/index.html",
];

async function readHtml(relativePath) {
  const filePath = path.join(DIST, relativePath);
  const html = await fs.readFile(filePath, "utf8");
  return { filePath, html };
}

function assertHtmlLooksDeployable(relativePath, html) {
  if (!html.includes('<div id="root">')) {
    throw new Error(`${relativePath} is missing the root mount node.`);
  }

  if (html.includes('/src/main.tsx')) {
    throw new Error(`${relativePath} still points to /src/main.tsx instead of built assets.`);
  }

  if (!/type="module"\s+crossorigin\s+src="[^"]*\/assets\/[^"]+\.js"/i.test(html)) {
    throw new Error(`${relativePath} is missing the built JS entry asset.`);
  }
}

async function main() {
  const assetDir = path.join(DIST, "assets");
  const assetNames = await fs.readdir(assetDir);

  const hasBuiltJs = assetNames.some((name) => name.endsWith(".js"));
  const hasBuiltCss = assetNames.some((name) => name.endsWith(".css"));

  if (!hasBuiltJs) throw new Error("dist/assets is missing built JavaScript files.");
  if (!hasBuiltCss) throw new Error("dist/assets is missing built CSS files.");

  for (const entry of ENTRY_PAGES) {
    const { html } = await readHtml(entry);
    assertHtmlLooksDeployable(entry, html);
  }

  const xml = await fs.readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
  for (const url of urls) {
    const pathname = new URL(url).pathname;
    const { html } = await readHtml(`${decodeURIComponent(pathname).replace(/^\//, '')}index.html`);
    assertHtmlLooksDeployable(pathname, html);
    assert.match(html, /<h1>[^<]+<\/h1>/, `${pathname} has no initial content`);
    assert.ok(!/name="robots" content="[^"]*noindex/.test(html), `${pathname} is excluded from indexing`);
    assert.ok(!/http-equiv="refresh"/i.test(html), `${pathname} redirects`);
    const canonicals = [...html.matchAll(/rel="canonical" href="([^"]+)"/g)];
    assert.equal(canonicals.length, 1, `${pathname} has duplicate canonicals`);
    assert.equal(canonicals[0][1], url, `${pathname} canonical differs from sitemap`);
    const langs = new Set();
    for (const match of html.matchAll(/rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) {
      assert.ok(!langs.has(match[1]), `${pathname} duplicates hreflang ${match[1]}`);
      langs.add(match[1]);
      const target = new URL(match[2]).pathname;
      assert.ok(!target.includes('//'), `${pathname} has malformed alternate ${target}`);
      await readHtml(`${decodeURIComponent(target).replace(/^\//, '')}index.html`);
    }
  }
  const projects = JSON.parse(await fs.readFile(path.join(ROOT, 'public/jsons/projects-real.json'), 'utf8'));
  const slugs = new Set();
  for (const project of projects.filter((p) => !p.hidden)) {
    const slug = projectSlug(project);
    assert.ok(slug && !slugs.has(slug), `Invalid/duplicate project slug: ${slug}`);
    slugs.add(slug);
    assert.ok(matchesProjectSlug(project, slug));
    const { html } = await readHtml(`en/project/${slug}/index.html`);
    assert.ok(html.includes(`/en/project/${slug}/`), `Missing canonical project: ${slug}`);
    const { html: alias } = await readHtml(`en/projects/${slug}/index.html`);
    assert.match(alias, /http-equiv="refresh"/);
    assert.ok(alias.includes(`/en/project/${slug}/`));
    const legacy = encodeURIComponent(project.name);
    if (legacy !== slug && (process.platform !== 'win32' || legacy.toLowerCase() !== slug)) {
      const { html: old } = await readHtml(`en/project/${project.name}/index.html`);
      assert.match(old, /http-equiv="refresh"/);
      assert.ok(old.includes(`/en/project/${slug}/`));
    }
  }
  assert.equal(projectSlug({ name: 'Convert Minecraft Server Icon' }), 'convert-minecraft-server-icon');
  assert.equal(projectSlug({ name: 'CobwebRemoveBoxPvP' }), 'cobwebremoveboxpvp');
  assert.equal(projectSlug({ id: 'Custom ID', name: 'Ignored Name' }), 'custom-id');
  console.log(`[verify-dist] Verified ${urls.length} canonical sitemap pages and ${slugs.size} project routes.`);
  console.log(`[verify-dist] Verified ${ENTRY_PAGES.length} HTML entrypoints and built assets.`);
}

main().catch((error) => {
  console.error("[verify-dist] Failed:", error);
  process.exitCode = 1;
});
