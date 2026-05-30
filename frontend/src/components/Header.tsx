"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sun, Moon, LogOut, User, Menu, ChevronDown, Heart, MapPin, X } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Ngăn scroll khi mở menu mobile
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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
            className={`${styles.iconButton} ${styles.desktopOnly}`}
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
          
          <button 
            className={styles.mobileMenuBtn} 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenuContent}>
          <div className={styles.mobileMenuHeader}>
            <Link href="/" className={styles.logo}>
              🏸 Badminton<span className={styles.logoHighlight}>Deals</span>
            </Link>
            <button 
              className={styles.closeMenuBtn}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div className={styles.mobileNav}>
            <Link href="/" className={styles.mobileNavLink}>Trang Chủ</Link>
            <Link href="/deals" className={styles.mobileNavLink}>Khuyến Mãi</Link>
          </div>

          <div className={styles.mobileMenuFooter}>
            <div className={styles.mobileThemeToggle}>
              <span>Chế độ nền tối</span>
              <button onClick={toggleTheme} className={styles.themeToggleBtn}>
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>

            {isAuthenticated && user ? (
              <div className={styles.mobileUserActions}>
                <div className={styles.mobileUserInfo}>
                  <div className={styles.avatar}>
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span>{user.fullName}</span>
                </div>
                <Link href="/profile" className={styles.mobileActionLink}>
                  <User size={18} /> Hồ Sơ Của Tôi
                </Link>
                <Link href="/profile/addresses" className={styles.mobileActionLink}>
                  <MapPin size={18} /> Sổ Địa Chỉ
                </Link>
                <Link href="/profile/favorites" className={styles.mobileActionLink}>
                  <Heart size={18} /> Bài Viết Đã Lưu
                </Link>
                <button onClick={logout} className={`${styles.mobileActionLink} ${styles.logoutItem}`}>
                  <LogOut size={18} /> Đăng Xuất
                </button>
              </div>
            ) : (
              <div className={styles.mobileAuthButtons}>
                <Link href="/login" className={styles.mobileLoginBtn}>Đăng Nhập</Link>
                <Link href="/register" className={styles.mobileRegisterBtn}>Đăng Ký</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
