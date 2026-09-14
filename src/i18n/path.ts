export const withLang = (lang: string, path: string) => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const normalized = (lang || 'en').trim().toLowerCase();
  // Keep the language visible in the URL (/en, /es, /ja).
  const splitAt = clean.search(/[?#]/);
  const pathname = splitAt < 0 ? clean : clean.slice(0, splitAt);
  const suffix = splitAt < 0 ? '' : clean.slice(splitAt);
  return `/${normalized}${pathname.endsWith('/') ? pathname : `${pathname}/`}${suffix}`;
};
