import React, { useState } from 'react';
import styles from './DealCard.module.css';
import { ExternalLink, MapPin, User, Clock, Heart } from 'lucide-react';
import ShareMenu from './ShareMenu';

export interface Deal {
  id: string;
  sourceName: string;
  externalUrl: string;
  productName: string;
  price: number;
  originalPrice?: number;
  condition?: string;
  location?: string;
  transactionMethod?: string;
  sellerName?: string;
  thumbnailUrl?: string;
  aiSummary?: string;
  tags?: string[];
  status: string;
  postedAt?: string | null;
  createdAt?: string | null;
  
  listingType?: string;
  description?: string;
  contactInfo?: string;
  userId?: string;
}

interface DealCardProps {
  deal: Deal;
  isFavorited?: boolean;
  onToggleFavorite?: (dealId: string) => void;
}

export default function DealCard({ deal, isFavorited = false, onToggleFavorite }: DealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formatMoney = (amount: number) => {
    if (amount === 0 || !amount) return "Liên hệ";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return "Mới cập nhật";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Mới cập nhật";
    
    // Tự tính thời gian tương đối (vd: 2 giờ trước)
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const conditionMap: Record<string, string> = {
    'new': 'Mới 100%',
    'likenew': 'Như mới',
    'used': 'Đã sử dụng'
  };

  const conditionLabel = deal.condition ? (conditionMap[deal.condition.toLowerCase()] || deal.condition) : 'Đã sử dụng';
  const methodLabel = deal.transactionMethod === 'buy' ? 'Cần mua' : 'Bán';
  const isUserListing = deal.listingType === 'user_listing';

  return (
    <div className={`glass-panel animate-fade-in ${styles.card}`}>
      <div className={styles.imageSection}>
        {deal.thumbnailUrl && !imgError ? (
          <img 
            src={deal.thumbnailUrl} 
            alt={deal.productName} 
            className={styles.image} 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>{isUserListing ? 'Ảnh sản phẩm' : deal.sourceName}</span>
          </div>
        )}
      </div>

      <div className={styles.contentSection}>
        {/* Header: Badges & Actions */}
        <div className={styles.cardHeader}>
          <div className={styles.badges}>
            {isUserListing && (
              <span className={`${styles.badge} ${styles.badgeDirect}`}>Đăng trực tiếp</span>
            )}
            {!isUserListing && deal.sourceName && (
              <span className={`${styles.badge} ${styles.badgeSource}`}>{deal.sourceName}</span>
            )}
            <span className={`${styles.badge} ${styles.badgeMethod}`}>{methodLabel}</span>
            <span className={`${styles.badge} ${styles.badgeCondition}`}>{conditionLabel}</span>
            {deal.tags && deal.tags.length > 0 && (
              <span className={`${styles.badge} ${styles.badgeTag}`}>
                {deal.tags[0]}
              </span>
            )}
          </div>
          <div className={styles.actions}>
            {!isUserListing && deal.externalUrl && (
              <a href={deal.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtn} aria-label="Xem trên Facebook">
                <ExternalLink size={16} />
              </a>
            )}
            <ShareMenu 
              url={isUserListing ? `${window.location.origin}/deals/${deal.id}` : deal.externalUrl}
              title={`[Deal] ${deal.productName} - ${formatMoney(deal.price)}`}
            />
            <button 
              className={`${styles.actionBtn} ${isFavorited ? styles.favoritedBtn : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (onToggleFavorite) onToggleFavorite(deal.id);
              }}
            >
              <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* Title & Price */}
        <div className={styles.titleWrapper}>
          <h3 className={styles.title}>{deal.productName}</h3>
          <div className={styles.priceContainer}>
            <span className={styles.price}>{formatMoney(deal.price)}</span>
            {deal.originalPrice && (
              <span className={styles.originalPrice}>{formatMoney(deal.originalPrice)}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className={`${styles.description} ${expanded ? styles.expanded : ''}`}>
          {deal.description || deal.aiSummary || "Không có mô tả chi tiết."}
        </div>
        
        {/* Contact Info (if user listing and expanded) */}
        {isUserListing && expanded && deal.contactInfo && (
          <div className={styles.contactInfoWrapper}>
            <strong>Liên hệ:</strong> {deal.contactInfo}
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.metaGroup}>
            <div className={styles.sellerInfo}>
              <div className={styles.avatarPlaceholder}>
                <User size={12} />
              </div>
              <span className={styles.sellerName}>{deal.sellerName || 'Người ẩn danh'}</span>
            </div>
            <span className={styles.separator}>•</span>
            <span className={styles.postTime}>{formatTime(deal.postedAt || deal.createdAt)}</span>
            {deal.location && (
              <>
                <span className={styles.separator}>•</span>
                <span className={styles.location}><MapPin size={12}/> {deal.location}</span>
              </>
            )}
          </div>
          
          <button 
            className={styles.readMoreBtn} 
            onClick={(e) => {
              e.preventDefault();
              setExpanded(!expanded);
            }}
          >
            {expanded ? 'Thu gọn ^' : 'Xem thêm ⌄'}
          </button>
        </div>
      </div>
    </div>
  );
}
