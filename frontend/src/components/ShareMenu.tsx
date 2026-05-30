import React, { useState, useRef, useEffect } from 'react';
import { Share2, Link as LinkIcon, Smartphone } from 'lucide-react';
import styles from './ShareMenu.module.css';
import { useToast } from '@/contexts/ToastContext';

interface ShareMenuProps {
  url: string;
  title: string;
}

export default function ShareMenu({ url, title }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        showToast('Đã sao chép liên kết!', 'success');
        setIsOpen(false);
      })
      .catch(() => {
        showToast('Lỗi khi sao chép', 'error');
      });
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleZaloShare = () => {
    const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(url)}`;
    window.open(zaloUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url
        });
      } catch (err) {
        console.log("Error sharing natively:", err);
      }
    } else {
      showToast('Trình duyệt không hỗ trợ chia sẻ trực tiếp', 'info');
    }
    setIsOpen(false);
  };

  const canNativeShare = typeof window !== 'undefined' && !!navigator.share;

  return (
    <div className={styles.shareContainer} ref={menuRef}>
      <button 
        className={styles.actionBtn} 
        aria-label="Chia sẻ"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Share2 size={16} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.menuHeader}>Chia sẻ deal này</div>
          <button className={styles.menuItem} onClick={handleFacebookShare}>
            <div className={styles.iconFb}>f</div>
            <span>Facebook</span>
          </button>
          <button className={styles.menuItem} onClick={handleZaloShare}>
            <div className={styles.iconZalo}>Z</div>
            <span>Zalo</span>
          </button>
          <button className={styles.menuItem} onClick={handleCopyLink}>
            <LinkIcon size={18} />
            <span>Sao chép link</span>
          </button>
          {canNativeShare && (
            <button className={styles.menuItem} onClick={handleNativeShare}>
              <Smartphone size={18} />
              <span>Tùy chọn khác...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
