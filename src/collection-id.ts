/** Leitet eine sprach-qualifizierte, pfadbasierte Collection-ID vom Glob-Entry ab. */
export function entryToId(entry: string): string {
  return entry.replace(/\.mdx?$/, '');
}
