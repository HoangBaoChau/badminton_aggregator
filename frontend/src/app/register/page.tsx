"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/services/api';
import styles from './Register.module.css';
import { Mail, Lock, AlertCircle, Loader2, User, Phone, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Mật khẩu phải dài ít nhất 6 ký tự');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await apiClient.post('/auth/register', formData);
      // Chuyển sang trang thông báo thành công
      router.push(`/register/success?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel animate-fade-in ${styles.formCard}`}>
        <div className={styles.header}>
          <h2>Tạo Tài Khoản Mới</h2>
          <p>Tham gia cộng đồng săn deal cầu lông</p>
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
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">Họ (First Name)</label>
              <div className={styles.inputWrapper}>
                <User className={styles.inputIcon} size={18} />
                <input 
                  id="firstName" 
                  type="text" 
                  placeholder="Ví dụ: Nguyễn" 
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Tên (Last Name)</label>
              <div className={styles.inputWrapper}>
                <User className={styles.inputIcon} size={18} />
                <input 
                  id="lastName" 
                  type="text" 
                  placeholder="Ví dụ: Văn A" 
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={18} />
              <input 
                id="email" 
                type="email" 
                placeholder="Nhập địa chỉ email" 
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Mật khẩu</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input 
                id="password" 
                type="password" 
                placeholder="Ít nhất 6 ký tự" 
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone">Số điện thoại (Không bắt buộc)</label>
            <div className={styles.inputWrapper}>
              <Phone className={styles.inputIcon} size={18} />
              <input 
                id="phone" 
                type="text" 
                placeholder="Nhập số điện thoại" 
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={isLoading || !!success}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Đăng Ký'}
          </button>
        </form>
        
        <div className={styles.footer}>
          <span>Bạn đã có tài khoản? </span>
          <Link href="/login" className={styles.loginLink}>Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
}
