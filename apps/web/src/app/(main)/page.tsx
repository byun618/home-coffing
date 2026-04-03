'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BeanWithStats } from '@home-coffing/shared-types';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import styles from './page.module.css';
import { BeanAddModal } from '@/components/bean/BeanAddModal';
import { BeanEditModal } from '@/components/bean/BeanEditModal';
import { ConsumptionModal } from '@/components/consumption/ConsumptionModal';

export default function HomePage() {
  const { user, logout } = useAuth();
  const [beans, setBeans] = useState<BeanWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editBean, setEditBean] = useState<BeanWithStats | null>(null);
  const [consumeBean, setConsumeBean] = useState<BeanWithStats | null>(null);

  const fetchBeans = useCallback(async () => {
    try {
      const data = await api<BeanWithStats[]>('/beans');
      setBeans(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBeans();
  }, [fetchBeans]);

  const handleConsumeClick = (bean: BeanWithStats, e: React.MouseEvent) => {
    e.stopPropagation();
    setConsumeBean(bean);
  };

  const handleModalClose = () => {
    setAddOpen(false);
    setEditBean(null);
    setConsumeBean(null);
    fetchBeans();
  };

  if (loading) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>홈 커핑</h1>
        <button className={styles.logoutBtn} onClick={logout}>
          로그아웃
        </button>
      </header>

      <main className={styles.content}>
        {beans.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyEmoji}>☕</p>
            <p className={styles.emptyText}>첫 원두를 등록해보세요</p>
            <button
              className={styles.emptyButton}
              onClick={() => setAddOpen(true)}
            >
              원두 추가
            </button>
          </div>
        ) : (
          beans.map((bean) => (
            <div
              key={bean.id}
              className={styles.card}
              onClick={() => setEditBean(bean)}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardInfo}>
                  <p className={styles.cardName}>{bean.name}</p>
                  <p className={styles.cardDate}>
                    {bean.roastDate} 로스팅
                  </p>
                </div>
                <span
                  className={`${styles.badge} ${bean.status === 'order' ? styles.badgeDanger : styles.badgeSafe}`}
                >
                  {bean.status === 'order' ? '주문 필요' : '여유'}
                </span>
              </div>

              <div className={styles.progressBg}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.max(2, 100 - bean.progress)}%` }}
                />
              </div>

              <p className={styles.stats}>
                {bean.remainAmount}g 남음 · {bean.remainCups}잔 ·{' '}
                {bean.remainDays}일
              </p>

              <button
                className={styles.drinkBtn}
                disabled={bean.remainAmount <= 0}
                onClick={(e) => handleConsumeClick(bean, e)}
              >
                마셨어요
              </button>
            </div>
          ))
        )}
      </main>

      {beans.length > 0 && (
        <button className={styles.fab} onClick={() => setAddOpen(true)}>
          +
        </button>
      )}

      {addOpen && <BeanAddModal onClose={handleModalClose} />}
      {editBean && (
        <BeanEditModal bean={editBean} onClose={handleModalClose} />
      )}
      {consumeBean && (
        <ConsumptionModal bean={consumeBean} onClose={handleModalClose} />
      )}
    </div>
  );
}
