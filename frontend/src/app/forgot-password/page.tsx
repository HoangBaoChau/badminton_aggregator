"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/services/api';
import styles from './ForgotPassword.module.css';
import { Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Vui lòng nhập địa chỉ email của bạn');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res: any = await apiClient.post('/auth/forgot-password', { email });
      setSuccess(res || 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel animate-fade-in ${styles.formCard}`}>
        <div className={styles.header}>
          <h2>Quên Mật Khẩu</h2>
          <p>Nhập email của bạn để nhận liên kết đặt lại mật khẩu</p>
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
        
        {!success ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email đã đăng ký</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={18} />
                <input 
                  id="email" 
                  type="email" 
                  placeholder="Nhập địa chỉ email của bạn" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Gửi Yêu Cầu'}
            </button>
          </form>
        ) : (
          <div className={styles.backToLogin}>
            <Link href="/login" className={styles.outlineBtn}>
              Quay lại Đăng nhập
            </Link>
          </div>
        )}
        
        {!success && (
          <div className={styles.footer}>
            <Link href="/login" className={styles.backLink}>Quay lại trang Đăng nhập</Link>
          </div>
        )}
      </div>
    </div>
  );
}
