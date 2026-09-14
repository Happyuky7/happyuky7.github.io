type ProjectIdentity = { id?: string; name?: string };
export function projectSlug(project: ProjectIdentity): string;
export function matchesProjectSlug(project: ProjectIdentity, slug: string): boolean;
