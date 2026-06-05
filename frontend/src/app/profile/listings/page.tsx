"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiClient } from '@/services/api';
import DealCard, { Deal } from '@/components/DealCard';
import styles from './Listings.module.css';
import { PlusCircle, Edit, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { DealCardSkeleton } from '@/components/Skeleton';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/contexts/ToastContext';

export default function MyListingsPage() {
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const size = 10;
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info',
    onConfirm: () => {}
  });
  
  const { data, error, isLoading, mutate } = useSWR<any>(
    `/deals/my-listings?page=${page}&size=${size}`, 
    fetcher
  );

  const handleDelete = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa bài đăng',
      message: 'Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/deals/listings/${id}`);
          mutate(); // Reload data
          showToast('Đã xóa bài đăng thành công', 'success');
        } catch (err) {
          showToast('Có lỗi xảy ra khi xóa bài đăng', 'error');
        }
      }
    });
  };

  const handleMarkAsSold = (deal: Deal) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Đánh dấu đã bán',
      message: 'Bạn muốn đánh dấu bài đăng này là Đã bán?',
      type: 'info',
      onConfirm: async () => {
        try {
          showToast('Tính năng đang hoàn thiện...', 'info');
        } catch (err) {
          showToast('Lỗi khi đánh dấu đã bán', 'error');
        }
      }
    });
  };

  const deals: Deal[] = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bài đăng của tôi</h1>
          <p className={styles.subtitle}>Quản lý các bài đăng bán / mua của bạn ({totalElements} bài)</p>
        </div>
        <Link href="/deals/create" className={styles.createBtn}>
          <PlusCircle size={18} /> Đăng tin mới
        </Link>
      </div>

      {isLoading && (
        <div className={styles.list}>
          {[1, 2, 3].map(i => <DealCardSkeleton key={i} />)}
        </div>
      )}

      {error && <div className={styles.error}>Lỗi tải dữ liệu. Vui lòng thử lại.</div>}

      {!isLoading && !error && deals.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏸</div>
          <h3>Bạn chưa có bài đăng nào</h3>
          <p>Hãy tạo bài đăng đầu tiên để bắt đầu giao dịch với cộng đồng nhé!</p>
          <Link href="/deals/create" className={styles.createBtnLarge}>Đăng tin ngay</Link>
        </div>
      )}

      {!isLoading && deals.length > 0 && (
        <div className={styles.list}>
          {deals.map(deal => (
            <div key={deal.id} className={styles.listingWrapper}>
              <div className={styles.cardContainer}>
                <DealCard deal={deal} />
              </div>
              <div className={styles.actionPanel}>
                <button 
                  className={`${styles.actionBtn} ${styles.editBtn}`}
                  onClick={() => showToast('Tính năng sửa đang phát triển', 'info')}
                >
                  <Edit size={16} /> Sửa tin
                </button>
                <button 
                  className={`${styles.actionBtn} ${styles.soldBtn}`}
                  onClick={() => handleMarkAsSold(deal)}
                >
                  <CheckCircle size={16} /> Đã bán
                </button>
                <button 
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(deal.id)}
                >
                  <Trash2 size={16} /> Xóa tin
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            disabled={page === 0} 
            onClick={() => setPage(p => p - 1)}
            className={styles.pageBtn}
          >
            Trang trước
          </button>
          <span>{page + 1} / {totalPages}</span>
          <button 
            disabled={page >= totalPages - 1} 
            onClick={() => setPage(p => p + 1)}
            className={styles.pageBtn}
          >
            Trang sau
          </button>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
