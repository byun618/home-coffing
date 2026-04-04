'use client';

import { useState } from 'react';
import type { BeanWithStats } from '@home-coffing/shared-types';
import { api } from '@/lib/api';
import { BottomModal } from '../ui/BottomModal';
import styles from './ConsumptionModal.module.css';

interface ConsumptionModalProps {
  beans: BeanWithStats[];
  onClose: () => void;
}

export function ConsumptionModal({ beans, onClose }: ConsumptionModalProps) {
  const activeBeans = beans.filter((b) => b.remainAmount > 0);
  const [amounts, setAmounts] = useState<Record<number, number>>(
    Object.fromEntries(activeBeans.map((b) => [b.id, 0])),
  );
  const [submitting, setSubmitting] = useState(false);

  const setAmount = (beanId: number, value: number) => {
    setAmounts((prev) => ({ ...prev, [beanId]: Math.max(0, value) }));
  };

  const hasAny = Object.values(amounts).some((v) => v > 0);

  const handleSubmit = async () => {
    const items = Object.entries(amounts)
      .filter(([, amount]) => amount > 0)
      .map(([beanId, amount]) => ({ beanId: Number(beanId), amount }));

    if (items.length === 0) return;

    setSubmitting(true);
    try {
      await api('/consumptions', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (activeBeans.length === 0) {
    return (
      <BottomModal title="소비 기록" onClose={onClose}>
        <p className={styles.emptyText}>먼저 원두를 등록해주세요</p>
      </BottomModal>
    );
  }

  return (
    <BottomModal title="소비 기록" onClose={onClose}>
      <div className={styles.form}>
        {activeBeans.map((bean) => (
          <div key={bean.id} className={styles.row}>
            <span className={styles.beanName}>{bean.name}</span>
            <div className={styles.stepper}>
              <button
                className={styles.stepperBtn}
                onClick={() => setAmount(bean.id, (amounts[bean.id] ?? 0) - 1)}
              >
                −
              </button>
              <input
                className={styles.stepperInput}
                type="number"
                value={amounts[bean.id] ?? 0}
                onChange={(e) => setAmount(bean.id, Number(e.target.value) || 0)}
                min={0}
                step="0.1"
              />
              <button
                className={styles.stepperBtn}
                onClick={() => setAmount(bean.id, (amounts[bean.id] ?? 0) + 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}

        <button
          className={styles.button}
          onClick={handleSubmit}
          disabled={submitting || !hasAny}
        >
          {submitting ? '기록 중...' : '기록'}
        </button>
      </div>
    </BottomModal>
  );
}
