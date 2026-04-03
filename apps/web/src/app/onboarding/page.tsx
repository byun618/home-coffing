'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { registerPush } from '@/lib/push';
import styles from './page.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [cupsPerDay, setCupsPerDay] = useState(2);
  const [gramsPerCup, setGramsPerCup] = useState(20);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.defaultCupsPerDay) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.defaultCupsPerDay) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api('/users/me/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({
          defaultCupsPerDay: cupsPerDay,
          defaultGramsPerCup: gramsPerCup,
        }),
      });
      await refreshUser();
      registerPush().catch(() => {});
      router.push('/');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.emoji}>☕</span>
        <h1 className={styles.title}>커피 습관을 알려주세요</h1>
        <p className={styles.subtitle}>주문 타이밍 계산에 사용돼요</p>
      </div>

      <div className={styles.form}>
        <div className={styles.field}>
          <p className={styles.label}>하루 평균 몇 잔 마시나요?</p>
          <div className={styles.stepper}>
            <button
              className={styles.stepperBtn}
              onClick={() => setCupsPerDay(Math.max(1, cupsPerDay - 1))}
            >
              −
            </button>
            <div className={styles.stepperValue}>{cupsPerDay}잔</div>
            <button
              className={styles.stepperBtn}
              onClick={() => setCupsPerDay(cupsPerDay + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <p className={styles.label}>1잔에 원두 몇 g 쓰나요?</p>
          <div className={styles.stepper}>
            <button
              className={styles.stepperBtn}
              onClick={() => setGramsPerCup(Math.max(1, gramsPerCup - 1))}
            >
              −
            </button>
            <div className={styles.stepperValue}>{gramsPerCup}g</div>
            <button
              className={styles.stepperBtn}
              onClick={() => setGramsPerCup(gramsPerCup + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button
        className={styles.button}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? '저장 중...' : '시작하기'}
      </button>
    </div>
  );
}
