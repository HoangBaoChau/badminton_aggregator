"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './ProfileLayout.module.css';
import { User, MapPin, Package, LogOut, Loader2, Heart, PenSquare } from 'lucide-react';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Nếu chưa đăng nhập thì đẩy về trang login
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  const navItems = [
    { name: 'Hồ Sơ Của Tôi', path: '/profile', icon: <User size={20} /> },
    { name: 'Sổ Địa Chỉ', path: '/profile/addresses', icon: <MapPin size={20} /> },
    { name: 'Bài Đăng Của Tôi', path: '/profile/listings', icon: <PenSquare size={20} /> },
    { name: 'Bài Viết Đã Lưu', path: '/profile/favorites', icon: <Heart size={20} /> },
    { name: 'Đơn Hàng', path: '/profile/orders', icon: <Package size={20} /> }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.layoutWrapper}>
        
        {/* Sidebar */}
        <aside className={`glass-panel animate-fade-in ${styles.sidebar}`}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={styles.userDetails}>
              <h3>{user?.fullName}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
          
          <nav className={styles.navMenu}>
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <button onClick={logout} className={styles.logoutBtn}>
            <LogOut size={20} />
            Đăng Xuất
          </button>
        </aside>
        
        {/* Main Content */}
        <main className={`glass-panel animate-fade-in ${styles.mainContent}`}>
          {children}
        </main>
        
      </div>
    </div>
  );
}
