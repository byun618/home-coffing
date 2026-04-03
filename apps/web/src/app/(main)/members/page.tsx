'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CafeMember, CafeInfo } from '@home-coffing/shared-types';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function MembersPage() {
  const router = useRouter();
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [members, setMembers] = useState<CafeMember[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<CafeInfo>('/cafe').then(setCafe).catch(() => {});
    api<CafeMember[]>('/cafe/members').then(setMembers).catch(() => {});
  }, []);

  const handleInvite = async () => {
    try {
      const res = await api<{ token: string }>('/invites', { method: 'POST' });
      const url = `${window.location.origin}/invite/${res.token}`;
      if (navigator.share) {
        await navigator.share({ title: '홈 커핑 초대', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      const res = await api<{ token: string }>('/invites', { method: 'POST' });
      const url = `${window.location.origin}/invite/${res.token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ←
        </button>
        <h1 className={styles.title}>같이 쓰는 사람들</h1>
      </header>

      {cafe && (
        <div className={styles.cafeInfo}>
          <span className={styles.cafeEmoji}>☕</span>
          <div>
            <p className={styles.cafeName}>{cafe.name}</p>
            <p className={styles.cafeSub}>{cafe.memberCount}명</p>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {members.map((member) => (
          <div key={member.id} className={styles.member}>
            <span className={styles.memberEmoji}>👤</span>
            <div className={styles.memberInfo}>
              <p className={styles.memberName}>{member.userName}</p>
              {member.role === 'admin' && (
                <p className={styles.memberRole}>관리자</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={handleInvite}>
          초대 링크 보내기
        </button>
        <button className={styles.secondaryBtn} onClick={handleCopyLink}>
          {copied ? '링크가 복사됐어요' : '링크 복사'}
        </button>
      </div>
    </div>
  );
}
