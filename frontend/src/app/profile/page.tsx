"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import styles from './Profile.module.css';
import { User, Phone, Mail, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile Update State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ type: '', text: '' });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res: any = await apiClient.get('/users/me');
      if (res) {
        setProfile(res);
        setFirstName(res.firstName || '');
        setLastName(res.lastName || '');
        setPhone(res.phone || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg({ type: '', text: '' });
    
    if (!firstName || !lastName) {
      setUpdateMsg({ type: 'error', text: 'Họ và tên không được để trống' });
      return;
    }

    setIsUpdating(true);
    try {
      const res: any = await apiClient.put('/users/me', { firstName, lastName, phone });
      setProfile(res);
      setUpdateMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err: any) {
      setUpdateMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    
    if (!currentPassword || !newPassword) {
      setPwdMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }
    
    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự' });
      return;
    }

    setIsChangingPwd(true);
    try {
      const res: any = await apiClient.post('/users/me/change-password', { 
        currentPassword, 
        newPassword 
      });
      setPwdMsg({ type: 'success', text: res || 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Đổi mật khẩu thất bại. Sai mật khẩu cũ?' 
      });
    } finally {
      setIsChangingPwd(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Hồ Sơ Của Tôi</h2>
      <p className={styles.pageSubtitle}>Quản lý thông tin cá nhân và bảo mật tài khoản</p>

      <div className={styles.grid}>
        {/* Update Profile Form */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Thông Tin Cá Nhân</h3>
          
          {updateMsg.text && (
            <div className={updateMsg.type === 'success' ? styles.successAlert : styles.errorAlert}>
              {updateMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{updateMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Email (Không thể thay đổi)</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={18} />
                <input type="email" value={profile?.email || ''} disabled className={styles.disabledInput} />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Họ (First Name)</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={18} />
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)} 
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Tên (Last Name)</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={18} />
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Số điện thoại</label>
              <div className={styles.inputWrapper}>
                <Phone className={styles.inputIcon} size={18} />
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="Thêm số điện thoại..."
                />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Lưu Thay Đổi'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Đổi Mật Khẩu</h3>
          
          {pwdMsg.text && (
            <div className={pwdMsg.type === 'success' ? styles.successAlert : styles.errorAlert}>
              {pwdMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Mật khẩu hiện tại</label>
              <div className={styles.inputWrapper}>
                <Shield className={styles.inputIcon} size={18} />
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Mật khẩu mới</label>
              <div className={styles.inputWrapper}>
                <Shield className={styles.inputIcon} size={18} />
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isChangingPwd}>
              {isChangingPwd ? <Loader2 className="animate-spin" size={20} /> : 'Cập Nhật Mật Khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
