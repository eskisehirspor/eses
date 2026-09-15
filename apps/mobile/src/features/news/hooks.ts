import { useQuery } from '@tanstack/react-query';
import { getPublicEnv } from '@/lib/env';
import { fetchAnnouncement, fetchNewsBySlug, fetchNewsCategories, fetchPublishedNews } from './api';

export function useNewsList(categoryId?: string) {
  return useQuery({
    queryKey: ['news', 'list', categoryId ?? 'all'],
    queryFn: () => fetchPublishedNews({ categoryId }),
    enabled: getPublicEnv().isConfigured,
  });
}

export function useNewsCategories() {
  return useQuery({
    queryKey: ['news', 'categories'],
    queryFn: fetchNewsCategories,
    enabled: getPublicEnv().isConfigured,
  });
}

export function useNewsDetail(slug: string) {
  return useQuery({
    queryKey: ['news', 'detail', slug],
    queryFn: () => fetchNewsBySlug(slug),
    enabled: Boolean(slug) && getPublicEnv().isConfigured,
  });
}

export function useAnnouncement() {
  return useQuery({
    queryKey: ['news', 'announcement'],
    queryFn: fetchAnnouncement,
    enabled: getPublicEnv().isConfigured,
  });
}
