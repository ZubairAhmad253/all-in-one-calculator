/**
 * Estimated reading time for an article, at about 220 words a minute.
 * Strips Markdown/MDX syntax and table pipes so they aren't counted as words.
 */
export function readingMinutes(markdown = ''): number {
  const text = markdown
    .replace(/^---[\s\S]*?---/, '') // frontmatter
    .replace(/<[^>]+>/g, ' ') // HTML / components
    .replace(/[#*_`>|\-[\]()]/g, ' ');
  const words = text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
  return Math.max(1, Math.round(words / 220));
}
