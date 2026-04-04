'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { BottomModal } from '../ui/BottomModal';
import styles from './BeanForm.module.css';

interface BeanAddModalProps {
  onClose: () => void;
}

export function BeanAddModal({ onClose }: BeanAddModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [orderedAt, setOrderedAt] = useState(today);
  const [roastDate, setRoastDate] = useState(today);
  const [arrivedAt, setArrivedAt] = useState('');
  const [degassingDays, setDegassingDays] = useState('7');
  const [cupsPerDay, setCupsPerDay] = useState('2.00');
  const [gramsPerCup, setGramsPerCup] = useState('20.00');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api('/beans', {
        method: 'POST',
        body: JSON.stringify({
          name,
          totalAmount: Number(totalAmount),
          orderedAt,
          roastDate,
          ...(arrivedAt ? { arrivedAt } : {}),
          degassingDays: Number(degassingDays),
          cupsPerDay: Number(cupsPerDay),
          gramsPerCup: Number(gramsPerCup),
        }),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomModal title="원두 추가" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>원두 이름</label>
          <input className={styles.input} placeholder="예) 에티오피아 예가체프" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>용량 (g)</label>
          <input className={styles.input} type="number" placeholder="200" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required min={1} />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>주문일</label>
            <input className={styles.input} type="date" value={orderedAt} onChange={(e) => setOrderedAt(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>로스팅일</label>
            <input className={styles.input} type="date" value={roastDate} onChange={(e) => setRoastDate(e.target.value)} required />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>배송완료일</label>
            <input className={styles.input} type="date" value={arrivedAt} onChange={(e) => setArrivedAt(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>디개싱 (일)</label>
            <input className={styles.input} type="number" value={degassingDays} onChange={(e) => setDegassingDays(e.target.value)} required min={0} />
          </div>
        </div>
        <p className={styles.hint}>주문 알림 기준에 사용돼요</p>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>보통 하루 몇 잔</label>
            <input className={styles.input} type="number" step="0.01" value={cupsPerDay} onChange={(e) => setCupsPerDay(e.target.value)} required min={0.01} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>보통 한 잔에 몇 g</label>
            <input className={styles.input} type="number" step="0.01" value={gramsPerCup} onChange={(e) => setGramsPerCup(e.target.value)} required min={0.01} />
          </div>
        </div>
        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? '저장 중...' : '저장'}
        </button>
      </form>
    </BottomModal>
  );
}
