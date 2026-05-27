"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import styles from './Success.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className={styles.container}>
      <div className={`glass-panel animate-fade-in ${styles.card}`}>
        <MailCheck className={styles.icon} size={64} />
        <h2>Đăng Ký Thành Công!</h2>
        <p className={styles.message}>
          Chúng tôi đã gửi một email xác thực đến địa chỉ:
          {email && <strong className={styles.emailText}> {email}</strong>}
        </p>
        <p className={styles.subtext}>
          Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) và nhấn vào liên kết để kích hoạt tài khoản của bạn.
        </p>
        
        <div className={styles.actions}>
          <Link href="/login" className={styles.primaryBtn}>
            Đi tới trang Đăng Nhập
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={`glass-panel animate-fade-in ${styles.card}`}>
          <p>Đang tải...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
