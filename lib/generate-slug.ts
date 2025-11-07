/**
 * Generates a URL-friendly slug from a title string.
 * Converts to lowercase, replaces spaces and special characters with hyphens,
 * and removes consecutive hyphens.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with a single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}



