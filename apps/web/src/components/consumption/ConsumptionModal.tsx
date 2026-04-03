'use client';

import { useState } from 'react';
import type { BeanWithStats } from '@home-coffing/shared-types';
import { api } from '@/lib/api';
import { BottomModal } from '../ui/BottomModal';
import styles from './ConsumptionModal.module.css';

interface ConsumptionModalProps {
  bean: BeanWithStats;
  onClose: () => void;
}

export function ConsumptionModal({ bean, onClose }: ConsumptionModalProps) {
  const [amount, setAmount] = useState(bean.perCup);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [water, setWater] = useState('');
  const [grindSize, setGrindSize] = useState('');
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const overRemain = amount > bean.remainAmount;

  const handleSubmit = async () => {
    if (amount <= 0) return;
    setSubmitting(true);
    try {
      await api(`/beans/${bean.id}/consumptions`, {
        method: 'POST',
        body: JSON.stringify({
          amount,
          ...(water ? { water: Number(water) } : {}),
          ...(grindSize ? { grindSize } : {}),
          ...(method ? { method } : {}),
          ...(note ? { note } : {}),
        }),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomModal title="소비 기록" onClose={onClose}>
      <div className={styles.form}>
        <div className={styles.beanName}>
          {bean.name} ({bean.roastDate})
        </div>

        <div className={styles.field}>
          <label className={styles.label}>사용량 (g)</label>
          <div className={styles.stepper}>
            <button
              className={styles.stepperBtn}
              onClick={() => setAmount(Math.max(1, amount - 1))}
            >
              −
            </button>
            <div className={styles.stepperValue}>{amount}</div>
            <button
              className={styles.stepperBtn}
              onClick={() => setAmount(amount + 1)}
            >
              +
            </button>
          </div>
          <p className={styles.hint}>
            기본값: 1잔 기준 ({bean.perCup}g)
          </p>
          {overRemain && (
            <p className={styles.warning}>남은 양보다 많아요</p>
          )}
        </div>

        <div className={styles.divider} />

        <button
          className={styles.toggleBtn}
          onClick={() => setRecipeOpen(!recipeOpen)}
        >
          레시피 기록 (선택)
          <span>{recipeOpen ? '▾' : '▸'}</span>
        </button>

        {recipeOpen && (
          <div className={styles.recipe}>
            <div className={styles.recipeRow}>
              <span className={styles.recipeLabel}>물 양 (ml)</span>
              <input
                className={styles.recipeInput}
                type="number"
                value={water}
                onChange={(e) => setWater(e.target.value)}
                placeholder="250"
              />
            </div>
            <div className={styles.recipeRow}>
              <span className={styles.recipeLabel}>분쇄도</span>
              <input
                className={styles.recipeInput}
                value={grindSize}
                onChange={(e) => setGrindSize(e.target.value)}
                placeholder="중간 (20클릭)"
              />
            </div>
            <div className={styles.recipeRow}>
              <span className={styles.recipeLabel}>브루잉 방법</span>
              <input
                className={styles.recipeInput}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="핸드드립"
              />
            </div>
            <div className={styles.recipeNoteField}>
              <span className={styles.recipeLabel}>메모</span>
              <textarea
                className={styles.recipeTextarea}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="메모"
                rows={2}
              />
            </div>
          </div>
        )}

        <button
          className={styles.button}
          onClick={handleSubmit}
          disabled={submitting || amount <= 0}
        >
          {submitting ? '기록 중...' : '기록'}
        </button>
      </div>
    </BottomModal>
  );
}
