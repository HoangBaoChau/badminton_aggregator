"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sun, Moon, LogOut, User, Menu, ChevronDown, Heart, MapPin } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContainer}`}>
        <Link href="/" className={styles.logo}>
          🏸 Badminton<span className={styles.logoHighlight}>Deals</span>
        </Link>
        
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Trang Chủ</Link>
          <Link href="/deals" className={styles.navLink}>Khuyến Mãi</Link>
        </nav>

        <div className={styles.actions}>
          <button 
            onClick={toggleTheme} 
            className={styles.iconButton}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <div className={styles.divider}></div>
          
          {isAuthenticated && user ? (
            <div className={styles.userMenuWrapper}>
              <div className={styles.userMenu}>
                <div className={styles.avatar}>
                  {user.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className={styles.userName}>{user.fullName}</span>
                <ChevronDown size={14} className={styles.chevron} />
              </div>
              <div className={styles.dropdown}>
                <Link href="/profile" className={styles.dropdownItem}>
                  <User size={16} />
                  <span>Hồ Sơ Của Tôi</span>
                </Link>
                <Link href="/profile/addresses" className={styles.dropdownItem}>
                  <MapPin size={16} />
                  <span>Sổ Địa Chỉ</span>
                </Link>
                <Link href="/profile/favorites" className={styles.dropdownItem}>
                  <Heart size={16} />
                  <span>Bài Viết Đã Lưu</span>
                </Link>
                <div className={styles.dropdownDivider}></div>
                <button onClick={logout} className={`${styles.dropdownItem} ${styles.logoutItem}`}>
                  <LogOut size={16} />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/login" className={styles.loginBtn}>Đăng Nhập</Link>
              <Link href="/register" className={styles.registerBtn}>Đăng Ký</Link>
            </div>
          )}
          
          <button className={styles.mobileMenuBtn}>
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
