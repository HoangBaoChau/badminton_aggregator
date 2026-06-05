"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher, apiClient } from '@/services/api';
import DealCard, { Deal } from '@/components/DealCard';
import { DealCardSkeleton } from '@/components/Skeleton';
import FilterBar from '@/components/FilterBar';
import styles from './Deals.module.css';
import { Sparkles, Filter, List, Search, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DealsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ 
    keyword: '', categoryId: '', brandId: '',
    location: '', transactionMethod: '', timeRange: '', condition: '',
    minPrice: 0, maxPrice: 10000000 
  });
  const [sortOrder, setSortOrder] = useState('newest');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);



  // Xây dựng URL có query params
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: '12',
    status: 'active',
  });

  const combinedKeyword = [searchKeyword, filters.keyword].filter(Boolean).join(' ');
  if (combinedKeyword) queryParams.append('keyword', combinedKeyword);
  if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
  if (filters.brandId) queryParams.append('brandId', filters.brandId);
  if (filters.location) queryParams.append('location', filters.location);
  if (filters.transactionMethod) queryParams.append('transactionMethod', filters.transactionMethod);
  if (filters.condition) queryParams.append('condition', filters.condition);
  if (filters.timeRange) queryParams.append('timeRange', filters.timeRange);
  if (filters.minPrice && filters.minPrice > 0) queryParams.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice && filters.maxPrice < 10000000) queryParams.append('maxPrice', filters.maxPrice.toString());

  const { data, error, isLoading } = useSWR<any>(`/deals?${queryParams.toString()}`, fetcher, {
    keepPreviousData: true,
  });

  const { data: favoritesData, mutate: mutateFavorites } = useSWR<any>(
    isAuthenticated ? '/favorites?size=100' : null,
    fetcher
  );

  const favoritedIds = new Set(
    favoritesData?.content?.map((d: any) => d.id) || []
  );

  const handleToggleFavorite = async (dealId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      await apiClient.post(`/favorites/${dealId}/toggle`);
      mutateFavorites();
    } catch (err) {
      console.error("Lỗi khi lưu/bỏ lưu bài viết:", err);
    }
  };

  const deals: Deal[] = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const isLastPage = data?.last || false;

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0); // Reset về trang đầu khi đổi filter
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <FilterBar 
            onSearch={handleSearch} 

            isOpenMobile={isMobileFilterOpen}
            onCloseMobile={() => setIsMobileFilterOpen(false)}
          />
        </aside>

        <main className={styles.content}>
          {/* Manual Search Bar */}
          <div className={styles.aiSearchBar}>
            <div className={styles.aiInputWrapper}>
              <Search size={20} className={styles.aiIcon} />
              <input 
                type="text" 
                placeholder="Tìm kiếm: Yonex Astrox 99, giày lining..." 
                className={styles.aiInput}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>

          {/* List Header */}
          <div className={styles.listHeader}>
            <div className={styles.resultCount}>
              <span className={styles.dot}></span>
              <span>{isLoading ? 'Đang tính toán...' : `${totalElements} kết quả`}</span>
            </div>

            <div className={styles.actionGroup}>
              <Link href="/shops" className={styles.shopRadarBtn}>
                <Store size={16} />
                <span>Shop Radar</span>
              </Link>
              <div className={styles.sortSelectWrapper}>
                <select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className={styles.errorState}>
              <p>Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</p>
            </div>
          )}

          {!error && deals.length === 0 && !isLoading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏸</div>
              <h2>Không tìm thấy deal nào!</h2>
              <p>Thử thay đổi bộ lọc xem sao.</p>
            </div>
          )}

          <div className={styles.dealList}>
            {deals.map((deal) => (
              <DealCard 
                key={deal.id} 
                deal={deal} 
                isFavorited={favoritedIds.has(deal.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {isLoading && (
            <div className={styles.dealList}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <DealCardSkeleton key={i} />
              ))}
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
        </main>
      </div>

      {/* Floating Mobile Filter Button */}
      <button 
        className={styles.mobileFilterBtn}
        onClick={() => setIsMobileFilterOpen(true)}
      >
        <Filter size={20} />
        <span>Bộ lọc</span>
      </button>
    </div>
  );
}
