"use client";

import React from 'react';
import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import styles from './ErrorPages.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.title}>Không tìm thấy trang</h2>
        <p className={styles.description}>
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          Đừng lo, có rất nhiều deal vợt cầu lông xịn đang chờ bạn!
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            <Home size={18} />
            Về Trang Chủ
          </Link>
          <Link href="/deals" className={styles.secondaryBtn}>
            <Search size={18} />
            Khám Phá Deals
          </Link>
        </div>
      </div>
    </div>
  );
}
