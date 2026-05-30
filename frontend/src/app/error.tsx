"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import styles from './ErrorPages.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Đã xảy ra lỗi ứng dụng:", error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorIcon}>
          <AlertTriangle size={64} />
        </div>
        <h2 className={styles.title}>Đã có lỗi xảy ra!</h2>
        <p className={styles.description}>
          Hệ thống gặp một chút sự cố khi tải trang này. Chúng tôi đã ghi nhận lỗi và sẽ khắc phục sớm nhất.
        </p>
        <div className={styles.actions}>
          <button onClick={() => reset()} className={styles.primaryBtn}>
            <RotateCcw size={18} />
            Thử lại
          </button>
          <Link href="/" className={styles.secondaryBtn}>
            <Home size={18} />
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
