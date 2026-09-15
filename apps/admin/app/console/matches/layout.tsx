import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { canOperateLiveMatch } from '@eskisehirspor/shared';
import { getSessionRoles } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function MatchesSectionLayout({ children }: { children: ReactNode }) {
  const session = await getSessionRoles();
  if (!canOperateLiveMatch(session.roles)) {
    redirect('/unauthorized');
  }
  return children;
}
