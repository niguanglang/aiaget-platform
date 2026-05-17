import { redirect } from 'next/navigation';

import SignInLogin from '@/components/ui/sign-in';
import { getStoredSession, isAccessTokenFresh } from '@/lib/session';

export default function LoginPage() {
  if (isAccessTokenFresh(getStoredSession())) {
    redirect('/dashboard');
  }

  return <SignInLogin />;
}
