"use client";

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/services/api';
import styles from './Dashboard.module.css';
import { 
  Database, 
  Terminal, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  // Fetch stats data
  const { data: sourcesData, isLoading: loadingSources } = useSWR<any>('/admin/sources', fetcher);
  const { data: logsData, isLoading: loadingLogs } = useSWR<any>('/admin/logs', fetcher);
  const { data: pendingDealsData, isLoading: loadingPending } = useSWR<any>('/deals?status=pending&size=1', fetcher);
  const { data: failedLogsData, isLoading: loadingFailed } = useSWR<any>('/admin/logs?size=5&status=failed', fetcher);

  const totalSources = sourcesData?.totalElements ?? 0;
  const activeSources = sourcesData?.content?.filter((s: any) => s.active).length ?? 0;
  const totalCrawlRuns = logsData?.totalElements ?? 0;
  const totalPendingDeals = pendingDealsData?.totalElements ?? 0;
  const recentFailedLogs = failedLogsData?.content || [];

  // Calculate success rate in recent 20 runs
  const recentLogs = logsData?.content || [];
  const successRuns = recentLogs.filter((l: any) => l.status?.toLowerCase() === 'success').length;
  const successRate = recentLogs.length > 0 
    ? Math.round((successRuns / recentLogs.length) * 100) 
    : 100;

  const stats = [
    { 
      label: 'Nguồn cào tin', 
      value: `${activeSources} / ${totalSources}`, 
      sub: 'Đang hoạt động',
      icon: <Database size={24} />, 
      colorClass: styles.iconBlue 
    },
    { 
      label: 'Deal chờ duyệt', 
      value: totalPendingDeals, 
      sub: 'Cần phê duyệt',
      icon: <Tag size={24} />, 
      colorClass: styles.iconYellow 
    },
    { 
      label: 'Tổng số lượt cào', 
      value: totalCrawlRuns, 
      sub: 'Lịch sử hệ thống',
      icon: <Terminal size={24} />, 
      colorClass: styles.iconGreen 
    },
    { 
      label: 'Tỷ lệ cào thành công', 
      value: `${successRate}%`, 
      sub: '20 lượt gần đây',
      icon: successRate > 90 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />, 
      colorClass: successRate > 90 ? styles.iconGreen : styles.iconRed 
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tổng quan Hệ thống</h1>
        <p className={styles.subtitle}>Bảng điều khiển giám sát bot cào tin và quản trị nội dung BadmintonDeals</p>
      </header>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div key={idx} className={styles.statCard}>
            <div className={`${styles.iconWrapper} ${stat.colorClass}`}>
              {stat.icon}
            </div>
            <div className={styles.statDetails}>
              <span className={styles.statValue}>
                {loadingSources || loadingLogs || loadingPending ? (
                  <RefreshCw className="animate-spin text-gray-400" size={20} />
                ) : (
                  stat.value
                )}
              </span>
              <span className={stat.label === 'Deal chờ duyệt' && totalPendingDeals > 0 
                ? 'text-yellow-500 font-bold text-xs mt-1' 
                : styles.statLabel}
              >
                {stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation / Actions */}
      <div className={styles.dashboardSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Lối tắt quản trị nhanh</h2>
        </div>
        <div className={styles.quickActions}>
          <Link href="/admin/deals" className={styles.actionBtn}>
            <Tag size={32} className={styles.actionIcon} />
            <span>Phê Duyệt Deal ({totalPendingDeals})</span>
          </Link>
          <Link href="/admin/sources" className={styles.actionBtn}>
            <Database size={32} className={styles.actionIcon} />
            <span>Cấu Hình Nguồn Cào Tin</span>
          </Link>
          <Link href="/admin/logs" className={styles.actionBtn}>
            <Terminal size={32} className={styles.actionIcon} />
            <span>Xem Nhật Ký Hệ Thống</span>
          </Link>
        </div>
      </div>

      {/* Recent Failed Logs */}
      <div className={styles.dashboardSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Các lượt cào thất bại gần đây (Failed Crawls)</h2>
          <Link href="/admin/logs?status=failed" className={styles.viewAllLink}>
            Xem tất cả bài lỗi <ArrowRight size={14} className="inline ml-1" />
          </Link>
        </div>

        {loadingFailed ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
          </div>
        ) : recentFailedLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={40} className={styles.emptyStateIcon} />
            <h2>Hệ thống cào tin ổn định!</h2>
            <p>Không ghi nhận lỗi cào tin nào trong các phiên gần nhất.</p>
          </div>
        ) : (
          <div className={styles.logTableWrapper}>
            <table className={styles.logTable}>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Mã Nguồn</th>
                  <th>Trạng thái</th>
                  <th>Tìm thấy</th>
                  <th>Lỗi chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {recentFailedLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                    <td><code className="bg-slate-800 px-2 py-1 rounded text-xs text-blue-400">{log.sourceId?.substring(0, 8)}...</code></td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles.statusFailed}`}>
                        failed
                      </span>
                    </td>
                    <td>{log.postsFound} bài (0 mới)</td>
                    <td className={styles.errorCell} title={log.errorMessage}>
                      {log.errorMessage || 'Không xác định'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
