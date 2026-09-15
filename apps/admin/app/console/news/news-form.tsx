'use client';

import { useState } from 'react';
import { slugify, type NewsStatus } from '@eskisehirspor/shared';
import { CoverUpload } from './cover-upload';

type Category = { id: string; title: string };

export function NewsForm({
  article,
  categories,
  action,
}: {
  article: {
    id?: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    cover_path: string | null;
    status: NewsStatus;
    is_announcement: boolean;
    published_at: string | null;
    category_ids: string[];
  };
  categories: Category[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [slug, setSlug] = useState(article.slug);
  const [title, setTitle] = useState(article.title);

  return (
    <form action={action} className="cms-form">
      {article.id ? <input type="hidden" name="id" value={article.id} /> : null}
      <label htmlFor="title">Başlık</label>
      <input
        id="title"
        name="title"
        required
        minLength={3}
        maxLength={140}
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          if (!article.id) {
            setSlug(slugify(event.target.value));
          }
        }}
      />
      <label htmlFor="slug">Slug</label>
      <input id="slug" name="slug" required value={slug} onChange={(event) => setSlug(event.target.value)} />
      <label htmlFor="excerpt">Özet</label>
      <textarea id="excerpt" name="excerpt" rows={3} maxLength={400} defaultValue={article.excerpt ?? ''} />
      <label htmlFor="content">İçerik</label>
      <textarea id="content" name="content" rows={12} defaultValue={article.content} />
      {article.id ? (
        <CoverUpload articleId={article.id} currentPath={article.cover_path} />
      ) : (
        <p className="muted">Kapak görseli, ilk kayıttan sonra eklenebilir.</p>
      )}
      <label htmlFor="status">Durum</label>
      <select id="status" name="status" defaultValue={article.status}>
        <option value="draft">Taslak</option>
        <option value="scheduled">Zamanlanmış</option>
        <option value="published">Yayında</option>
        <option value="archived">Arşiv</option>
      </select>
      <label htmlFor="published_at">Yayın zamanı</label>
      <input
        id="published_at"
        name="published_at"
        type="datetime-local"
        defaultValue={toLocalInput(article.published_at)}
      />
      <label className="inline">
        <input type="checkbox" name="is_announcement" defaultChecked={article.is_announcement} />
        Kulüp duyurusu (HOME’da öne çıkar)
      </label>
      <fieldset>
        <legend>Kategoriler</legend>
        {categories.map((category) => (
          <label key={category.id} className="inline">
            <input
              type="checkbox"
              name="category_ids"
              value={category.id}
              defaultChecked={article.category_ids.includes(category.id)}
            />
            {category.title}
          </label>
        ))}
      </fieldset>
      <button type="submit">Kaydet</button>
    </form>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
