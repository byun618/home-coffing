'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { BeanWithStats, ConsumptionItem } from '@home-coffing/shared-types';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function BeanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [bean, setBean] = useState<BeanWithStats | null>(null);
  const [consumptions, setConsumptions] = useState<ConsumptionItem[]>([]);

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [orderedAt, setOrderedAt] = useState('');
  const [roastDate, setRoastDate] = useState('');
  const [arrivedAt, setArrivedAt] = useState('');
  const [degassingDays, setDegassingDays] = useState('');
  const [cupsPerDay, setCupsPerDay] = useState('');
  const [gramsPerCup, setGramsPerCup] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api<BeanWithStats[]>('/beans'),
      api<{ items: ConsumptionItem[] }>(`/consumptions?beanId=${id}`),
    ]).then(([beans, consData]) => {
      const found = beans.find((b) => b.id === Number(id));
      if (!found) { router.replace('/'); return; }
      setBean(found);
      setName(found.name);
      setTotalAmount(String(found.totalAmount));
      setOrderedAt(found.orderedAt);
      setRoastDate(found.roastDate);
      setArrivedAt(found.arrivedAt || '');
      setDegassingDays(String(found.degassingDays));
      setCupsPerDay(String(found.cupsPerDay));
      setGramsPerCup(String(found.gramsPerCup));
      setConsumptions(consData.items);
    });
  }, [id, router]);

  if (!bean) return null;

  const settingDaily = bean.cupsPerDay * bean.gramsPerCup;
  const hasRecordBased = Math.abs(bean.dailyConsumption - settingDaily) > 0.1;
  const recordCups = bean.gramsPerCup > 0 ? (bean.dailyConsumption / bean.gramsPerCup).toFixed(1) : '0';
  const recordGrams = bean.cupsPerDay > 0 ? (bean.dailyConsumption / bean.cupsPerDay).toFixed(1) : '0';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api(`/beans/${bean.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          totalAmount: Number(totalAmount),
          orderedAt,
          roastDate,
          arrivedAt: arrivedAt || null,
          degassingDays: Number(degassingDays),
          cupsPerDay: Number(cupsPerDay),
          gramsPerCup: Number(gramsPerCup),
        }),
      });
      router.push('/');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 원두를 삭제할까요?')) return;
    await api(`/beans/${bean.id}`, { method: 'DELETE' });
    router.push('/');
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
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => router.push('/')}>←</button>
          <h1 className={styles.title}>{bean.name}</h1>
        </div>
        <button className={styles.deleteBtn} onClick={handleDelete}>삭제</button>
      </header>

      <main className={styles.content}>
        <h2 className={styles.sectionTitle}>원두 정보</h2>

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.field}>
            <label className={styles.label}>원두 이름</label>
            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>용량 (g)</label>
            <input className={styles.input} type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required min={1} />
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
          {hasRecordBased && (
            <p className={styles.calcHint}>소비 기록 기반: 하루 {recordCups}잔 · 한 잔에 {recordGrams}g</p>
          )}
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
          <button className={styles.saveBtn} type="submit" disabled={submitting}>
            {submitting ? '저장 중...' : '저장'}
          </button>
        </form>

        <div className={styles.divider} />

        <h2 className={styles.sectionTitle}>소비 기록</h2>
        {consumptions.length === 0 ? (
          <p className={styles.emptyRecord}>아직 기록이 없어요</p>
        ) : (
          consumptions.map((c) => (
            <div key={c.id} className={styles.consumptionRow}>
              <p className={styles.consumptionDate}>{formatTime(c.createdAt)}</p>
              <p className={styles.consumptionAmount}>{c.amount}g</p>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
