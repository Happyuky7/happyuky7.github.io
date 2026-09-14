// Shared by React, sitemap generation and static HTML generation.
export function projectSlug(project) {
  return String(project?.id || project?.name || '')
    .toLowerCase().trim().replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

export function matchesProjectSlug(project, slug) {
  return projectSlug(project) === slug || String(project?.name || '') === slug;
}
