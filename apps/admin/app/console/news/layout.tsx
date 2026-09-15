import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { hasContentAccess } from '@eskisehirspor/shared';
import { getSessionRoles } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function NewsSectionLayout({ children }: { children: ReactNode }) {
  const session = await getSessionRoles();
  if (!hasContentAccess(session.roles)) {
    redirect('/unauthorized');
  }
  return children;
}
