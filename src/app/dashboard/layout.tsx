import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/authOptions';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation/Navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <nav>
        <Navigation session={session} />
      </nav>
      <main>{children}</main>
    </>
  );
}
