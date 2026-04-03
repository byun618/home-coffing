'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { BottomModal } from '../ui/BottomModal';
import styles from './BeanForm.module.css';

interface BeanAddModalProps {
  onClose: () => void;
}

export function BeanAddModal({ onClose }: BeanAddModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [roastDate, setRoastDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [perCup, setPerCup] = useState(String(user?.defaultGramsPerCup ?? 20));
  const [deliveryDays, setDeliveryDays] = useState('3');
  const [degassingDays, setDegassingDays] = useState('7');
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
          roastDate,
          perCup: Number(perCup),
          deliveryDays: Number(deliveryDays),
          degassingDays: Number(degassingDays),
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
          <input
            className={styles.input}
            placeholder="예) 에티오피아 예가체프"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>용량 (g)</label>
          <input
            className={styles.input}
            type="number"
            placeholder="200"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            required
            min={1}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>로스팅일</label>
          <input
            className={styles.input}
            type="date"
            value={roastDate}
            onChange={(e) => setRoastDate(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>1잔당 사용량 (g)</label>
          <input
            className={styles.input}
            type="number"
            value={perCup}
            onChange={(e) => setPerCup(e.target.value)}
            required
            min={1}
          />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>배송일 (일)</label>
            <input
              className={styles.input}
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              required
              min={0}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>디개싱 (일)</label>
            <input
              className={styles.input}
              type="number"
              value={degassingDays}
              onChange={(e) => setDegassingDays(e.target.value)}
              required
              min={0}
            />
          </div>
        </div>
        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? '저장 중...' : '저장'}
        </button>
      </form>
    </BottomModal>
  );
}
