"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Login.module.css';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // apiClient.interceptors.response already extracts response.data.data
      const res: any = await apiClient.post('/auth/login', { email, password });
      
      if (res && res.accessToken) {
        login(res.accessToken, res.email, res.fullName, res.role);
        // Router push is handled in AuthContext
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel animate-fade-in ${styles.formCard}`}>
        <div className={styles.header}>
          <h2>Đăng Nhập</h2>
          <p>Chào mừng bạn trở lại với BadmintonDeals</p>
        </div>
        
        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={18} />
              <input 
                id="email" 
                type="email" 
                placeholder="Nhập địa chỉ email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <div className={styles.passwordHeader}>
              <label htmlFor="password">Mật khẩu</label>
              <Link href="/forgot-password" className={styles.forgotLink}>Quên mật khẩu?</Link>
            </div>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input 
                id="password" 
                type="password" 
                placeholder="Nhập mật khẩu" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Đăng Nhập'}
          </button>
        </form>
        
        <div className={styles.footer}>
          <span>Bạn chưa có tài khoản? </span>
          <Link href="/register" className={styles.registerLink}>Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
