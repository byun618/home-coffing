'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { BeanWithStats, ConsumptionItem } from '@home-coffing/shared-types';
import { api } from '@/lib/api';
import styles from './page.module.css';
import { BeanAddModal } from '@/components/bean/BeanAddModal';
import { ConsumptionModal } from '@/components/consumption/ConsumptionModal';

export default function HomePage() {
  const router = useRouter();
  const [beans, setBeans] = useState<BeanWithStats[]>([]);
  const [consumptions, setConsumptions] = useState<ConsumptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      await api('/cafe');
      const [beansData, consData] = await Promise.all([
        api<BeanWithStats[]>('/beans'),
        api<{ items: ConsumptionItem[] }>('/consumptions?limit=10'),
      ]);
      setBeans(beansData);
      setConsumptions(consData.items);
    } catch {
      setBeans([]);
      setConsumptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleModalClose = () => {
    setAddOpen(false);
    setConsumeOpen(false);
    fetchData();
  };

  if (loading) return null;

  const badgeLabel = (status: string) => {
    switch (status) {
      case 'degassing': return '디개싱 중';
      case 'safe': return '여유';
      case 'soon': return '곧 시켜야 해요';
      case 'order': return '지금 시켜야 해요';
      case 'empty': return '다 마셨어요';
      default: return '';
    }
  };

  const badgeClass = (status: string) => {
    switch (status) {
      case 'degassing': return styles.badgeDegassing;
      case 'safe': return styles.badgeSafe;
      case 'soon': return styles.badgeWarning;
      case 'order': return styles.badgeDanger;
      case 'empty': return styles.badgeEmpty;
      default: return '';
    }
  };

  const statsText = (bean: BeanWithStats) => {
    if (bean.status === 'degassing' && bean.degassingEndDate) {
      const end = new Date(bean.degassingEndDate);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `${bean.remainAmount}g · 디개싱 ${diff}일 남음`;
    }
    return `${bean.remainAmount}g 남음`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `오늘 ${time}`;
    if (isYesterday) return `어제 ${time}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>홈 커핑</h1>
      </header>

      <main className={styles.content}>
        {beans.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyEmoji}>☕</p>
            <p className={styles.emptyText}>첫 원두를 등록해보세요</p>
            <button className={styles.emptyButton} onClick={() => setAddOpen(true)}>
              원두 추가
            </button>
          </div>
        ) : (
          <>
            {beans.map((bean) => (
              <div
                key={bean.id}
                className={`${styles.card} ${bean.status === 'empty' ? styles.cardEmpty : ''}`}
                onClick={() => router.push(`/beans/${bean.id}`)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardInfo}>
                    <p className={styles.cardName}>{bean.name}</p>
                    <p className={styles.cardDate}>{bean.roastDate} 로스팅</p>
                  </div>
                  <span className={`${styles.badge} ${badgeClass(bean.status)}`}>
                    {badgeLabel(bean.status)}
                  </span>
                </div>
                <div className={styles.progressBg}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.max(2, 100 - bean.progress)}%` }}
                  />
                </div>
                <p className={styles.stats}>{statsText(bean)}</p>
              </div>
            ))}

            {consumptions.length > 0 && (
              <>
                <div className={styles.divider} />
                <h2 className={styles.sectionTitle}>소비 기록</h2>
                {consumptions.map((c) => (
                  <div key={c.id} className={styles.consumptionRow}>
                    <div className={styles.consumptionLeft}>
                      <p className={styles.consumptionDate}>{formatTime(c.createdAt)}</p>
                      <p className={styles.consumptionBean}>{c.beanName}</p>
                    </div>
                    <p className={styles.consumptionAmount}>{c.amount}g</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </main>

      {beans.length > 0 && (
        <div className={styles.fabGroup}>
          <button className={styles.fab} onClick={() => setConsumeOpen(true)}>☕</button>
          <button className={styles.fab} onClick={() => setAddOpen(true)}>+</button>
        </div>
      )}

      {addOpen && <BeanAddModal onClose={handleModalClose} />}
      {consumeOpen && <ConsumptionModal beans={beans} onClose={handleModalClose} />}
    </div>
  );
}
