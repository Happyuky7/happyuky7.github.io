import fs from "node:fs/promises";
import path from "node:path";

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
  if (!html.includes('<div id="root"></div>')) {
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

  console.log(`[verify-dist] Verified ${ENTRY_PAGES.length} HTML entrypoints and built assets.`);
}

main().catch((error) => {
  console.error("[verify-dist] Failed:", error);
  process.exitCode = 1;
});
