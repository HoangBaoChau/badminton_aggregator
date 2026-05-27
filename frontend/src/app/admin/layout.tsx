"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AdminLayout.module.css';
import { 
  LayoutDashboard, 
  Tag, 
  Database, 
  Terminal, 
  Home, 
  LogOut, 
  ShieldAlert, 
  Loader2 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  // Nếu không đăng nhập hoặc không phải ADMIN, chặn quyền truy cập
  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'ROLE_ADMIN')) {
    return (
      <div className={styles.deniedContainer}>
        <div className={styles.deniedCard}>
          <div className={styles.alertIcon}>
            <ShieldAlert size={64} />
          </div>
          <h2 className={styles.deniedTitle}>Truy Cập Bị Từ Chối</h2>
          <p className={styles.deniedText}>
            Bạn không có quyền quản trị để truy cập trang này. Vui lòng đăng nhập bằng tài khoản Quản trị viên (Admin) hoặc quay lại Trang Chủ.
          </p>
          <Link href="/" className={styles.backHomeBtn}>
            <Home size={18} />
            <span>Quay lại Trang Chủ</span>
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Tổng quan Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Duyệt & Quản Lý Deal', path: '/admin/deals', icon: <Tag size={20} /> },
    { name: 'Nguồn Cào Tin', path: '/admin/sources', icon: <Database size={20} /> },
    { name: 'Nhật Ký Hệ Thống', path: '/admin/logs', icon: <Terminal size={20} /> },
  ];

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <Link href="/admin" className={styles.logo}>
            🏸 Admin<span className={styles.logoHighlight}>Panel</span>
          </Link>
        </div>

        <nav className={styles.navMenu}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path}
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.adminInfo}>
            <div className={styles.avatar}>
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className={styles.adminDetails}>
              <span className={styles.adminName}>{user?.fullName}</span>
              <span className={styles.adminRole}>Quản trị viên</span>
            </div>
          </div>

          <Link href="/" className={styles.navItem} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
            <Home size={20} />
            <span>Trở về Trang Chủ</span>
          </Link>

          <button onClick={logout} className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
