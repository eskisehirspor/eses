'use client';

import { useState } from 'react';
import { NEWS_COVERS_BUCKET, newsCoverObjectPath } from '@eskisehirspor/shared';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { logger } from '@/lib/logger';

export function CoverUpload({
  articleId,
  currentPath,
}: {
  articleId: string;
  currentPath: string | null;
}) {
  const [path, setPath] = useState(currentPath ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const objectPath = newsCoverObjectPath(articleId, file.name);
      const { error } = await supabase.storage.from(NEWS_COVERS_BUCKET).upload(objectPath, file, {
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        logger.error('Kapak yüklenemedi', { code: 'storage.upload', cause: error.message });
        setMessage('Kapak yüklenemedi.');
        return;
      }
      setPath(objectPath);
    } catch (error) {
      logger.error('Kapak yükleme istisnası', {
        code: 'storage.upload',
        cause: error instanceof Error ? error.message : 'unknown',
      });
      setMessage('Kapak yüklenemedi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label htmlFor="cover">Kapak görseli</label>
      <input
        id="cover"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      <input type="hidden" name="cover_path" value={path} />
      {path ? <p className="muted">Kayıtlı yol: {path}</p> : <p className="muted">İsteğe bağlı. Önce haberi kaydet, sonra kapak ekle.</p>}
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
