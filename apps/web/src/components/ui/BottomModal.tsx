'use client';

import styles from './BottomModal.module.css';

interface BottomModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function BottomModal({ title, children, onClose }: BottomModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <h2 className={styles.title}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
