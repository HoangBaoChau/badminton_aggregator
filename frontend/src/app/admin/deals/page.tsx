"use client";

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import useSWR from 'swr';
import { fetcher, apiClient } from '@/services/api';
import styles from './AdminDeals.module.css';
import { 
  Check, 
  EyeOff, 
  Eye, 
  ExternalLink, 
  Search, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AdminDealsPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('pending'); // default to pending for moderation
  const [search, setSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Build query URL
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: '10',
    status: status
  });
  if (search) queryParams.append('keyword', search);

  const { data, error, isLoading, mutate } = useSWR<any>(`/deals?${queryParams.toString()}`, fetcher, {
    keepPreviousData: true
  });

  const deals = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(0);
  };

  const handleUpdateStatus = async (dealId: string, newStatus: string) => {
    setIsUpdating(dealId);
    try {
      await apiClient.patch(`/admin/deals/${dealId}/status`, { status: newStatus });
      // Mutate current SWR cache to update list
      mutate();
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái deal:", err);
      showToast("Cập nhật trạng thái thất bại. Vui lòng thử lại!", 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  const formatMoney = (amount: number) => {
    if (amount === 0 || !amount) return "Liên hệ";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const tabs = [
    { id: 'pending', label: 'Chờ duyệt' },
    { id: 'active', label: 'Đang hiển thị' },
    { id: 'hidden', label: 'Đã ẩn' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Kiểm duyệt bài viết</h1>
          <p className={styles.subtitle}>Quản lý và kiểm duyệt tin đăng quét được từ Facebook</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filtersSection}>
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleStatusChange(tab.id)}
              className={`${styles.tabBtn} ${status === tab.id ? styles.activeTab : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      {/* Main Table */}
      {error && (
        <div className={styles.emptyContainer} style={{ borderColor: '#ef4444' }}>
          <AlertCircle size={40} className="text-red-500 mb-4" />
          <h2 className={styles.emptyTitle}>Có lỗi xảy ra</h2>
          <p className={styles.emptyText}>Không thể tải danh sách bài viết từ máy chủ.</p>
        </div>
      )}

      {!error && deals.length === 0 && !isLoading && (
        <div className={styles.emptyContainer}>
          <div className="text-4xl mb-4">🏸</div>
          <h2 className={styles.emptyTitle}>Không tìm thấy bài viết nào</h2>
          <p className={styles.emptyText}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      )}

      {!error && (deals.length > 0 || isLoading) && (
        <div className={styles.dealsTableWrapper}>
          {isLoading && !data ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="animate-spin text-blue-500" size={40} />
            </div>
          ) : (
            <table className={styles.dealsTable}>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Nguồn</th>
                  <th>Giá bán</th>
                  <th>Thời gian quét</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal: any) => (
                  <tr key={deal.id} style={{ opacity: isUpdating === deal.id ? 0.6 : 1 }}>
                    <td>
                      <div className={styles.dealProduct}>
                        {deal.thumbnailUrl ? (
                          <img src={deal.thumbnailUrl} alt={deal.productName} className={styles.thumbnail} />
                        ) : (
                          <div className={styles.noThumbnail}>🏸</div>
                        )}
                        <span className={styles.productName} title={deal.productName}>
                          {deal.productName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs">
                        {deal.sourceName}
                      </span>
                    </td>
                    <td>
                      <span className={styles.price}>{formatMoney(deal.price)}</span>
                    </td>
                    <td>
                      <span className="text-gray-500 text-xs">
                        {new Date(deal.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        deal.status === 'active' ? styles.statusActive :
                        deal.status === 'pending' ? styles.statusPending :
                        styles.statusHidden
                      }`}>
                        {deal.status === 'active' ? 'Đang hiện' :
                         deal.status === 'pending' ? 'Chờ duyệt' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        {deal.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(deal.id, 'active')}
                            className={`${styles.actionBtn} ${styles.btnApprove}`}
                            disabled={isUpdating === deal.id}
                          >
                            <Check size={14} />
                            <span>Duyệt</span>
                          </button>
                        )}
                        
                        {deal.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(deal.id, 'hidden')}
                            className={`${styles.actionBtn} ${styles.btnHide}`}
                            disabled={isUpdating === deal.id}
                          >
                            <EyeOff size={14} />
                            <span>Ẩn tin</span>
                          </button>
                        )}

                        {deal.status === 'hidden' && (
                          <button
                            onClick={() => handleUpdateStatus(deal.id, 'active')}
                            className={`${styles.actionBtn} ${styles.btnApprove}`}
                            disabled={isUpdating === deal.id}
                          >
                            <Eye size={14} />
                            <span>Khôi phục</span>
                          </button>
                        )}

                        <a
                          href={deal.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.actionBtn} ${styles.btnView}`}
                        >
                          <ExternalLink size={14} />
                          <span>Gốc</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.pageInfo}>
                Hiển thị {deals.length} / {totalElements} bài viết (Trang {page + 1} / {totalPages})
              </span>
              <div className={styles.pageNav}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                  className={styles.pageBtn}
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1 || isLoading}
                  className={styles.pageBtn}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
