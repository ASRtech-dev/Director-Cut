export function generateId(prefix: string): string {
  // Generates a simple pseudo-random string
  const randomStr = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${randomStr}`;
}

export function generateEpisodeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
