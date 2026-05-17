import { redirect } from 'next/navigation';

import { getStoredSession, isAccessTokenFresh } from '@/lib/session';

export default function HomePage() {
  const session = getStoredSession();

  redirect(isAccessTokenFresh(session) ? '/dashboard' : '/login');
}
