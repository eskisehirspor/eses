import {
  CATALOG_TEAMS,
  TEAM_CRESTS_BUCKET,
  catalogCrestDownloadUrls,
  catalogCrestPngObjectName,
  catalogCrestSourceKind,
} from '@eskisehirspor/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { processCrestToTransparentPng } from './crest-process';

const CREST_MAX_BYTES = 1_048_576;

async function existingPngCrest(supabase: SupabaseClient, providerTeamId: string): Promise<string | null> {
  const path = catalogCrestPngObjectName(providerTeamId);
  const { data, error } = await supabase.storage.from(TEAM_CRESTS_BUCKET).list('', {
    limit: 100,
    search: path,
  });
  if (error) {
    logger.error('Arma listelenemedi', { code: 'catalog.crest.list', cause: error.message, path });
    return null;
  }
  return data?.some((object) => object.name === path) ? path : null;
}

async function uploadCrestFromSource(
  supabase: SupabaseClient,
  providerTeamId: string,
  sourceUrl: string,
): Promise<string | null> {
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: 'image/png,image/jpeg,image/webp,image/*',
      'User-Agent': 'EskisehirsporApp/0.1 (+catalog-crest-sync)',
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    logger.error('Arma indirilemedi', {
      code: 'catalog.crest.fetch',
      cause: String(response.status),
      providerTeamId,
      sourceUrl,
    });
    return null;
  }
  const mime = (response.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength === 0 || buffer.byteLength > CREST_MAX_BYTES) {
    logger.error('Arma boyutu uygun değil', {
      code: 'catalog.crest.size',
      cause: String(buffer.byteLength),
      providerTeamId,
    });
    return null;
  }

  const objectName = catalogCrestPngObjectName(providerTeamId);
  let uploadBody = buffer;
  const contentType = 'image/png';

  if (mime.includes('svg')) {
    logger.error('Arma formatı atlandı', { code: 'catalog.crest.mime', cause: mime, providerTeamId });
    return null;
  }

  const processMime = mime.includes('png')
    ? 'image/png'
    : mime.includes('jpeg') || mime.includes('jpg')
      ? 'image/jpeg'
      : mime.includes('webp')
        ? 'image/webp'
        : buffer[0] === 0x89
          ? 'image/png'
          : 'image/jpeg';

  const processed = processCrestToTransparentPng(buffer, processMime);
  if (processed) {
    uploadBody = Buffer.from(processed);
  } else if (!processMime.includes('png')) {
    logger.error('Arma işlenemedi', {
      code: 'catalog.crest.process',
      cause: processMime,
      providerTeamId,
    });
    return null;
  }

  if (uploadBody.byteLength > CREST_MAX_BYTES) {
    logger.error('Arma boyutu uygun değil', {
      code: 'catalog.crest.size',
      cause: String(uploadBody.byteLength),
      providerTeamId,
    });
    return null;
  }

  const { error } = await supabase.storage.from(TEAM_CRESTS_BUCKET).upload(objectName, uploadBody, {
    contentType,
    upsert: true,
    cacheControl: '60',
  });
  if (error) {
    // Retry once after remove — stale objects / missing upsert policy.
    await supabase.storage.from(TEAM_CRESTS_BUCKET).remove([objectName]);
    const retry = await supabase.storage.from(TEAM_CRESTS_BUCKET).upload(objectName, uploadBody, {
      contentType,
      upsert: true,
      cacheControl: '60',
    });
    if (retry.error) {
      logger.error('Arma yüklenemedi', {
        code: 'catalog.crest.upload',
        cause: retry.error.message,
        providerTeamId,
      });
      return null;
    }
  }
  return objectName;
}

export async function syncCatalogCrests(supabase: SupabaseClient, teamIds: Map<string, string>) {
  const summary = {
    club: 0,
    stored: 0,
    missing: 0,
    preferred: 0,
    tff: 0,
  };
  for (const team of CATALOG_TEAMS) {
    const teamId = teamIds.get(team.slug);
    if (!teamId) {
      continue;
    }
    if (team.isEskisehirspor) {
      summary.club += 1;
      const { error } = await supabase.from('teams').update({ crest_path: null }).eq('id', teamId);
      if (error) {
        logger.error('Kulüp arma yolu temizlenemedi', { code: 'catalog.crest.club', cause: error.message });
      }
      continue;
    }
    try {
      const pngPath = catalogCrestPngObjectName(team.providerTeamId);
      let path: string | null = null;
      const urls = catalogCrestDownloadUrls(team);
      for (const [index, url] of urls.entries()) {
        path = await uploadCrestFromSource(supabase, team.providerTeamId, url);
        if (path) {
          if (index === 0 && catalogCrestSourceKind(team) === 'preferred') {
            summary.preferred += 1;
          } else {
            summary.tff += 1;
          }
          break;
        }
      }
      if (!path) {
        path = await existingPngCrest(supabase, team.providerTeamId);
      }
      if (!path) {
        summary.missing += 1;
        continue;
      }
      const { error } = await supabase.from('teams').update({ crest_path: path ?? pngPath }).eq('id', teamId);
      if (error) {
        logger.error('Arma yolu yazılamadı', { code: 'catalog.crest.path', cause: error.message, slug: team.slug });
        summary.missing += 1;
        continue;
      }
      summary.stored += 1;
    } catch (error) {
      logger.error('Arma işlenemedi', {
        code: 'catalog.crest.sync',
        cause: error instanceof Error ? error.message : 'unknown',
        slug: team.slug,
      });
      summary.missing += 1;
    }
  }
  return summary;
}
