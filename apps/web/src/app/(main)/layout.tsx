'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (!user.defaultCupsPerDay) {
      router.replace('/onboarding');
    }
  }, [user, loading, router]);

  if (loading || !user || !user.defaultCupsPerDay) return null;

  return <>{children}</>;
}
