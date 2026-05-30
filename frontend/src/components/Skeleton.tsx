import React from 'react';
import styles from './Skeleton.module.css';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className}`} />;
}

export function DealCardSkeleton() {
  return (
    <div className={styles.cardSkeleton}>
      <div className={styles.imageSkeleton} />
      <div className={styles.contentSkeleton}>
        <div className={styles.badgeSkeleton} />
        <div className={styles.titleSkeleton} />
        <div className={styles.priceSkeleton} />
        <div className={styles.descSkeleton} />
        <div className={styles.descSkeleton} style={{ width: '80%' }} />
        <div className={styles.footerSkeleton}>
          <div className={styles.avatarSkeleton} />
          <div className={styles.textSkeleton} />
        </div>
      </div>
    </div>
  );
}
