'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { InviteInfo } from '@home-coffing/shared-types';
import styles from '../../login/page.module.css';

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<InviteInfo>(`/invites/${token}`)
      .then(setInvite)
      .catch(() => setError('유효하지 않은 초대에요'));
  }, [token]);

  if (loading) return null;

  if (!user) {
    return (
      <div className={styles.container}>
        <p className={styles.subtitle}>로그인 후 초대를 수락할 수 있어요</p>
        <a href="/login" className={styles.linkAction}>
          로그인하기
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p style={{ fontSize: 48 }}>😢</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!invite) return null;

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await api(`/invites/${token}/accept`, { method: 'POST' });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '수락에 실패했어요');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <p style={{ fontSize: 48 }}>✉️</p>
      <div className={styles.logo}>
        <h1 className={styles.title} style={{ color: 'var(--color-text-primary)', fontSize: 20 }}>
          카페에 초대받았어요
        </h1>
        <p className={styles.subtitle}>
          {invite.invitedByName}님이 {invite.cafeName}에 초대했어요
        </p>
      </div>

      <div
        style={{
          width: '100%',
          background: 'var(--color-surface)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            카페
          </span>
          <span style={{ fontWeight: 500, fontSize: 13 }}>
            {invite.cafeName}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            초대한 사람
          </span>
          <span style={{ fontWeight: 500, fontSize: 13 }}>
            {invite.invitedByName}
          </span>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <button
          className={styles.button}
          onClick={handleAccept}
          disabled={submitting}
        >
          {submitting ? '수락 중...' : '수락하기'}
        </button>
        <button
          className={styles.link}
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none' }}
        >
          거절하기
        </button>
      </div>
    </div>
  );
}
