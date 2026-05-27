"use client";

import React, { useEffect, useState } from 'react';
import styles from './SessionExpiredModal.module.css';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Lắng nghe tín hiệu từ api.ts
    const handleSessionExpired = () => {
      setIsOpen(true);
    };

    window.addEventListener('session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session_expired', handleSessionExpired);
    };
  }, []);

  if (!isOpen) return null;

  const handleLogin = () => {
    setIsOpen(false);
    router.push('/login');
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.iconContainer}>
          <AlertCircle size={48} />
        </div>
        <h2 className={styles.title}>Phiên Đăng Nhập Hết Hạn</h2>
        <p className={styles.message}>
          Để bảo vệ an toàn cho tài khoản, phiên đăng nhập của bạn đã hết hạn. Hoặc bạn đang truy cập tính năng vượt quá thẩm quyền. Vui lòng đăng nhập lại để tiếp tục.
        </p>
        <button onClick={handleLogin} className={styles.loginBtn}>
          Đăng nhập ngay
        </button>
      </div>
    </div>
  );
}
