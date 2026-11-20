import AuthPanel from '@/components/AuthPanel';

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  let nextPath = '';
  if (params && typeof params.next === 'string') {
    nextPath = params.next;
  }

  let notice = '';
  if (params && params.expired === '1') {
    notice = 'Your session has ended because your account was updated. Please sign in again.';
  }

  return <AuthPanel initialMode="login" nextPath={nextPath} notice={notice} />;
}