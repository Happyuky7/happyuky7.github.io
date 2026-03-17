export function publicPath(pathname: string): string {
  const base = (import.meta as any).env?.BASE_URL || '/';
  const baseNormalized = String(base).endsWith('/') ? String(base) : `${base}/`;
  const clean = (pathname || '').startsWith('/') ? String(pathname).slice(1) : String(pathname);
  return `${baseNormalized}${clean}`;
}
