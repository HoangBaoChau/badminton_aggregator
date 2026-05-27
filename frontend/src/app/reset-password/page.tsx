"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/services/api';
import styles from './ResetPassword.module.css';
import { Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Nếu không có token trong URL, thông báo lỗi ngay
  if (!token) {
    return (
      <div className={styles.container}>
        <div className={`glass-panel ${styles.formCard}`}>
          <div className={styles.header}>
            <h2>Lỗi Đường Dẫn</h2>
          </div>
          <div className={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>Đường link không hợp lệ hoặc không có mã xác thực. Vui lòng kiểm tra lại email.</span>
          </div>
          <div className={styles.backToLogin}>
            <Link href="/forgot-password" className={styles.outlineBtn}>
              Thử lại
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu mới');
      return;
    }
    
    if (password.length < 6) {
      setError('Mật khẩu phải dài ít nhất 6 ký tự');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res: any = await apiClient.post('/auth/reset-password', { 
        token, 
        newPassword: password 
      });
      setSuccess(res || 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      
      // Auto redirect sau 3s
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Token có thể đã hết hạn hoặc không hợp lệ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel animate-fade-in ${styles.formCard}`}>
        <div className={styles.header}>
          <h2>Tạo Mật Khẩu Mới</h2>
          <p>Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>
        
        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.successAlert}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}
        
        {!success && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Mật khẩu mới</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input 
                  id="password" 
                  type="password" 
                  placeholder="Ít nhất 6 ký tự" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Nhập lại mật khẩu mới" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Đổi Mật Khẩu'}
            </button>
          </form>
        )}
        
        {success && (
          <div className={styles.backToLogin}>
            <Link href="/login" className={styles.primaryBtn}>
              Đi tới Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={`glass-panel ${styles.formCard}`}>
          <p style={{textAlign: 'center'}}>Đang tải...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
