"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './CreateListing.module.css';
import { Box, Tag, MapPin, Activity, DollarSign, PenTool, Link as LinkIcon, Phone } from 'lucide-react';
import Link from 'next/link';

export default function CreateListingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    condition: 'used',
    transactionMethod: 'gdtt',
    location: '',
    description: '',
    contactInfo: '',
    thumbnailUrl: '',
    tags: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/deals/create');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) return <div className={styles.loadingState}>Đang kiểm tra...</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: formData.price ? parseInt(formData.price) : 0,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      await apiClient.post('/deals/listings', payload);
      router.push('/profile/listings');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng bài.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <h1>Đăng bài bán / mua mới</h1>
          <p>Điền thông tin chi tiết để mọi người dễ dàng tìm thấy tin của bạn.</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Thông tin cơ bản */}
          <div className={styles.section}>
            <h3><Box size={18} /> Thông tin cơ bản</h3>
            
            <div className={styles.formGroup}>
              <label>Tên sản phẩm *</label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="VD: Vợt Yonex Astrox 99 Pro 4U..."
                required
                className={styles.input}
              />
            </div>

            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label>Giá bán (VNĐ) *</label>
                <div className={styles.inputWithIcon}>
                  <DollarSign size={16} />
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="VD: 1500000"
                    required
                    min="0"
                    className={styles.input}
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Tình trạng *</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className={styles.select}>
                  <option value="new">Mới 100%</option>
                  <option value="likenew">Như mới (Likenew)</option>
                  <option value="used">Đã sử dụng (Used)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Giao dịch & Liên hệ */}
          <div className={styles.section}>
            <h3><Activity size={18} /> Giao dịch & Liên hệ</h3>
            
            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label>Loại giao dịch *</label>
                <select name="transactionMethod" value={formData.transactionMethod} onChange={handleChange} className={styles.select}>
                  <option value="gdtt">Bán (Giao dịch trực tiếp)</option>
                  <option value="cod">Bán (Ship COD)</option>
                  <option value="trade">Giao lưu (Trade)</option>
                  <option value="buy">Cần mua</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Khu vực *</label>
                <div className={styles.inputWithIcon}>
                  <MapPin size={16} />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="VD: Cầu Giấy, Hà Nội"
                    required
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Thông tin liên hệ *</label>
              <div className={styles.inputWithIcon}>
                <Phone size={16} />
                <input
                  type="text"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  placeholder="SĐT, Zalo hoặc Link Facebook cá nhân..."
                  required
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Chi tiết */}
          <div className={styles.section}>
            <h3><PenTool size={18} /> Chi tiết sản phẩm</h3>
            
            <div className={styles.formGroup}>
              <label>Mô tả chi tiết *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nêu rõ tình trạng trầy xước (nếu có), lưới đang đan, phụ kiện đi kèm..."
                required
                rows={5}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tags (Cách nhau bằng dấu phẩy)</label>
              <div className={styles.inputWithIcon}>
                <Tag size={16} />
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="VD: yonex, 4u, thecong, ..."
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Link ảnh sản phẩm (Không bắt buộc)</label>
              <div className={styles.inputWithIcon}>
                <LinkIcon size={16} />
                <input
                  type="url"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleChange}
                  placeholder="https://imgur.com/..., https://facebook.com/..."
                  className={styles.input}
                />
              </div>
              {formData.thumbnailUrl && (
                <div className={styles.imagePreview}>
                  <img src={formData.thumbnailUrl} alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href="/deals" className={styles.cancelBtn}>Hủy bỏ</Link>
            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? 'Đang xử lý...' : 'Đăng bài ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
