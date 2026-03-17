import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

async function exists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const root = process.cwd();
  const inFile = path.join(root, 'public', 'assets', 'img', 'background-1.jpg');
  const outWebp = path.join(root, 'public', 'assets', 'img', 'background-1-1600.webp');
  const outJpg = path.join(root, 'public', 'assets', 'img', 'background-1-1600.jpg');

  if (!(await exists(inFile))) {
    console.error(`[optimize-backgrounds] Missing input: ${inFile}`);
    process.exit(1);
  }

  await fs.mkdir(path.dirname(outWebp), { recursive: true });

  // Resize to a sensible max width for full-screen backgrounds (keeps aspect ratio).
  // WebP quality tuned for big background images.
  const pipeline = sharp(inFile)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true });

  await pipeline.clone().webp({ quality: 72 }).toFile(outWebp);
  await pipeline
    .clone()
    .jpeg({ quality: 78, progressive: true })
    .toFile(outJpg);

  const sWebp = await fs.stat(outWebp);
  console.log(`[optimize-backgrounds] Wrote ${path.relative(root, outWebp)} (${sWebp.size} bytes)`);

  const sJpg = await fs.stat(outJpg);
  console.log(`[optimize-backgrounds] Wrote ${path.relative(root, outJpg)} (${sJpg.size} bytes)`);
}

main().catch((e) => {
  console.error('[optimize-backgrounds] Failed:', e);
  process.exit(1);
});
