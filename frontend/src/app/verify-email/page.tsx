"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/services/api';
import styles from './VerifyEmail.module.css';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực email của bạn...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã xác thực (Token).');
      return;
    }

    const verifyToken = async () => {
      try {
        const res: any = await apiClient.get(`/auth/verify?token=${token}`);
        setStatus('success');
        setMessage(res || 'Tài khoản của bạn đã được kích hoạt thành công!');
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'Xác thực thất bại hoặc link đã hết hạn.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className={styles.container}>
      <div className={`glass-panel animate-fade-in ${styles.card}`}>
        
        {status === 'loading' && (
          <div className={styles.content}>
            <Loader2 className={`animate-spin ${styles.loadingIcon}`} size={48} />
            <h2>Đang xử lý</h2>
            <p>{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className={styles.content}>
            <CheckCircle className={styles.successIcon} size={56} />
            <h2>Thành Công!</h2>
            <p className={styles.successMessage}>{message}</p>
            <Link href="/login" className={styles.loginBtn}>
              Đi tới Đăng Nhập
            </Link>
          </div>
        )}
        
        {status === 'error' && (
          <div className={styles.content}>
            <XCircle className={styles.errorIcon} size={56} />
            <h2>Lỗi Xác Thực</h2>
            <p className={styles.errorMessage}>{message}</p>
            <Link href="/register" className={styles.outlineBtn}>
              Quay lại Đăng ký
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Bọc component có sử dụng useSearchParams trong Suspense để tránh lỗi hydration của Next.js 14+
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={`glass-panel animate-fade-in ${styles.card}`}>
          <div className={styles.content}>
            <Loader2 className={`animate-spin ${styles.loadingIcon}`} size={48} />
            <h2>Đang tải...</h2>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
