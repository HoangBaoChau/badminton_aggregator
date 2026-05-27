import React, { useState, useEffect } from 'react';
import styles from './AddressFormModal.module.css';
import { X, Loader2 } from 'lucide-react';

export interface AddressData {
  id?: string;
  label: string;
  streetLine1: string;
  streetLine2: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressData) => Promise<void>;
  initialData?: AddressData | null;
  isLoading?: boolean;
}

const DEFAULT_FORM: AddressData = {
  label: '',
  streetLine1: '',
  streetLine2: '',
  ward: '',
  district: '',
  province: '',
  isDefault: false
};

export default function AddressFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  isLoading 
}: AddressFormModalProps) {
  const [formData, setFormData] = useState<AddressData>(DEFAULT_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || DEFAULT_FORM);
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.streetLine1 || !formData.district || !formData.province) {
      setError('Vui lòng điền các trường bắt buộc (*)');
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu địa chỉ');
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`glass-panel animate-fade-in ${styles.modalContent}`}>
        <div className={styles.modalHeader}>
          <h3>{initialData ? 'Sửa Địa Chỉ' : 'Thêm Địa Chỉ Mới'}</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>
        
        {error && <div className={styles.errorAlert}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nhãn địa chỉ (VD: Nhà riêng, Công ty)</label>
            <input 
              name="label" 
              value={formData.label} 
              onChange={handleChange} 
              placeholder="VD: Nhà riêng" 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Tỉnh/Thành phố *</label>
            <input 
              name="province" 
              value={formData.province} 
              onChange={handleChange} 
              placeholder="VD: Hà Nội" 
            />
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Quận/Huyện *</label>
              <input 
                name="district" 
                value={formData.district} 
                onChange={handleChange} 
                placeholder="VD: Cầu Giấy" 
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Phường/Xã</label>
              <input 
                name="ward" 
                value={formData.ward} 
                onChange={handleChange} 
                placeholder="VD: Dịch Vọng" 
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Địa chỉ chi tiết (Số nhà, đường) *</label>
            <input 
              name="streetLine1" 
              value={formData.streetLine1} 
              onChange={handleChange} 
              placeholder="VD: Số 123, Đường Xuân Thủy" 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Ghi chú thêm (Không bắt buộc)</label>
            <input 
              name="streetLine2" 
              value={formData.streetLine2} 
              onChange={handleChange} 
              placeholder="Gần tòa nhà ABC..." 
            />
          </div>

          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="isDefault" 
              name="isDefault" 
              checked={formData.isDefault} 
              onChange={handleChange} 
            />
            <label htmlFor="isDefault">Đặt làm địa chỉ mặc định</label>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={isLoading}>
              Hủy
            </button>
            <button type="submit" className={styles.saveBtn} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Lưu Địa Chỉ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
