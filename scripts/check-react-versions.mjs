import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const reactVersion = packageJson.dependencies?.react;
const reactDomVersion = packageJson.dependencies?.['react-dom'];

if (!reactVersion || !reactDomVersion) {
  console.error('Missing react or react-dom dependency in package.json.');
  process.exit(1);
}

if (reactVersion !== reactDomVersion) {
  console.error(`React version mismatch: react=${reactVersion}, react-dom=${reactDomVersion}`);
  process.exit(1);
}

console.log(`React versions aligned: ${reactVersion}`);
