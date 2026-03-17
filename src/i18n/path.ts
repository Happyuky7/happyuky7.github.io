export const withLang = (lang: string, path: string) => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const normalized = (lang || 'en').trim().toLowerCase();
  // Keep the language visible in the URL (/en, /es, /ja).
  return `/${normalized}${clean}`;
};
