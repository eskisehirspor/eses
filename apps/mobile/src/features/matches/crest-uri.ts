import { CATALOG_TEAMS, resolveCrestDownloadUrl } from '@eskisehirspor/shared';

/** Preferred PNG sources — loaded live from the catalog URLs. */
const PREFERRED_CREST_BY_SLUG = new Map(
  CATALOG_TEAMS.flatMap((team) =>
    team.preferredCrestUrl
      ? ([[team.slug, resolveCrestDownloadUrl(team.preferredCrestUrl)]] as const)
      : [],
  ),
);

/**
 * Prefer live preferred PNG URL by slug; else pass through https crest_path.
 * Storage public URL resolution stays in api.ts (needs Supabase client).
 */
export function resolvePreferredOrRemoteCrestUri(input: {
  slug: string;
  isClub: boolean;
  crestPath: string | null;
}): string | null {
  if (input.isClub) {
    return null;
  }
  const preferred = PREFERRED_CREST_BY_SLUG.get(input.slug);
  if (preferred) {
    return preferred;
  }
  const path = input.crestPath;
  if (!path) {
    return null;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return null;
}

export function preferredCrestCount() {
  return PREFERRED_CREST_BY_SLUG.size;
}
