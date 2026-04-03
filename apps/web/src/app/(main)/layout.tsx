'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    router.replace('/login');
    return null;
  }

  if (!user.defaultCupsPerDay) {
    router.replace('/onboarding');
    return null;
  }

  return <>{children}</>;
}
