"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiClient } from '@/services/api';
import DealCard, { Deal } from '@/components/DealCard';
import styles from './Favorites.module.css';
import { RefreshCw, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SavedDealsPage() {
  const [page, setPage] = useState(0);

  const { data, error, isLoading, mutate } = useSWR<any>(`/favorites?page=${page}&size=12`, fetcher, {
    keepPreviousData: true
  });

  const deals: Deal[] = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const isLastPage = data?.last || false;

  const handleToggleFavorite = async (dealId: string) => {
    try {
      // Gọi API toggle (xóa khỏi danh sách yêu thích)
      await apiClient.post(`/favorites/${dealId}/toggle`);
      // Revalidate dữ liệu từ backend để cập nhật danh sách hiển thị
      mutate();
    } catch (err) {
      console.error("Lỗi khi hủy lưu bài viết:", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Bài Viết Đã Lưu</h2>
        <p className={styles.subtitle}>Danh sách các deal cầu lông bạn đã lưu và quan tâm</p>
      </div>

      {error && (
        <div className={styles.errorState}>
          <p>Có lỗi xảy ra khi tải danh sách bài viết đã lưu.</p>
        </div>
      )}

      {!error && deals.length === 0 && !isLoading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Heart size={48} className={styles.brokenHeart} />
          </div>
          <h2>Chưa có bài viết nào được lưu!</h2>
          <p>Hãy khám phá các deal cầu lông cực hot và lưu lại để xem sau nhé.</p>
          <Link href="/" className={styles.exploreBtn}>
            <span>Khám phá Deal ngay</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <div className={styles.grid}>
        {deals.map((deal) => (
          <DealCard 
            key={deal.id} 
            deal={deal} 
            isFavorited={true}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {isLoading && (
        <div className={styles.loadingState}>
          <RefreshCw className={`${styles.spinner} animate-spin`} size={32} />
          <p>Đang tải danh sách bài viết đã lưu...</p>
        </div>
      )}

      {!isLoading && deals.length > 0 && (
        <div className={styles.pagination}>
          <button 
            className={styles.loadMoreBtn} 
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Trang trước
          </button>
          <span className="text-gray-400 font-semibold">
            {page + 1} / {totalPages === 0 ? 1 : totalPages}
          </span>
          <button 
            className={styles.loadMoreBtn} 
            onClick={() => setPage(p => p + 1)}
            disabled={isLastPage}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
