'use client';

import { useState } from 'react';
import type { BeanWithStats } from '@home-coffing/shared-types';
import { api } from '@/lib/api';
import { BottomModal } from '../ui/BottomModal';
import styles from './BeanForm.module.css';

interface BeanEditModalProps {
  bean: BeanWithStats;
  onClose: () => void;
}

export function BeanEditModal({ bean, onClose }: BeanEditModalProps) {
  const [name, setName] = useState(bean.name);
  const [totalAmount, setTotalAmount] = useState(String(bean.totalAmount));
  const [roastDate, setRoastDate] = useState(bean.roastDate);
  const [perCup, setPerCup] = useState(String(bean.perCup));
  const [deliveryDays, setDeliveryDays] = useState(String(bean.deliveryDays));
  const [degassingDays, setDegassingDays] = useState(
    String(bean.degassingDays),
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api(`/beans/${bean.id}`, {
        method: 'PATCH',
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

  const handleDelete = async () => {
    if (!confirm('이 원두를 삭제할까요?')) return;
    await api(`/beans/${bean.id}`, { method: 'DELETE' });
    onClose();
  };

  return (
    <BottomModal title="원두 수정" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>원두 이름</label>
          <input
            className={styles.input}
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
        <button
          type="button"
          className={styles.dangerBtn}
          onClick={handleDelete}
        >
          삭제
        </button>
      </form>
    </BottomModal>
  );
}
