"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import styles from './Address.module.css';
import { MapPin, Plus, Star, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import AddressFormModal, { AddressData } from '@/components/AddressFormModal';

export default function AddressPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Notice state
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res: any = await apiClient.get('/users/me');
      if (res && res.addresses) {
        // Sort to put default address first
        const sorted = [...res.addresses].sort((a, b) => (b.default === true ? 1 : 0) - (a.default === true ? 1 : 0));
        setAddresses(sorted);
      }
    } catch (err) {
      console.error("Lỗi khi tải địa chỉ:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotice = (type: string, text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice({ type: '', text: '' }), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr: any) => {
    setEditingAddress({
      id: addr.id,
      label: addr.label || '',
      streetLine1: addr.streetLine1 || '',
      streetLine2: addr.streetLine2 || '',
      ward: addr.ward || '',
      district: addr.district || '',
      province: addr.province || '',
      isDefault: addr.default || false // API trả về "default" nhưng form dùng "isDefault"
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: AddressData) => {
    setIsSubmitting(true);
    try {
      if (editingAddress?.id) {
        // Update
        await apiClient.put(`/users/me/addresses/${editingAddress.id}`, data);
        showNotice('success', 'Đã cập nhật địa chỉ thành công');
      } else {
        // Create
        await apiClient.post('/users/me/addresses', data);
        showNotice('success', 'Đã thêm địa chỉ mới');
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch (err) {
      throw err; // throw cho Modal bắt
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    
    try {
      await apiClient.delete(`/users/me/addresses/${id}`);
      showNotice('success', 'Đã xóa địa chỉ');
      fetchAddresses();
    } catch (err) {
      showNotice('error', 'Không thể xóa địa chỉ. Thử lại sau.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.patch(`/users/me/addresses/${id}/default`);
      showNotice('success', 'Đã thiết lập địa chỉ mặc định');
      fetchAddresses();
    } catch (err) {
      showNotice('error', 'Có lỗi xảy ra');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Sổ Địa Chỉ</h2>
          <p className={styles.pageSubtitle}>Quản lý địa chỉ nhận hàng của bạn</p>
        </div>
        <button onClick={handleOpenAddModal} className={styles.addBtn}>
          <Plus size={20} />
          Thêm Địa Chỉ Mới
        </button>
      </div>

      {notice.text && (
        <div className={notice.type === 'success' ? styles.successAlert : styles.errorAlert}>
          {notice.type === 'error' && <AlertCircle size={18} />}
          <span>{notice.text}</span>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <MapPin size={48} className={styles.emptyIcon} />
          <h3>Chưa có địa chỉ nào</h3>
          <p>Hãy thêm địa chỉ để chúng tôi có thể giao hàng cho bạn.</p>
        </div>
      ) : (
        <div className={styles.addressList}>
          {addresses.map((addr) => (
            <div key={addr.id} className={`${styles.addressCard} ${addr.default ? styles.isDefaultCard : ''}`}>
              
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <h4>{addr.label || 'Địa chỉ'}</h4>
                  {addr.default && (
                    <span className={styles.defaultBadge}>
                      <Star size={12} className={styles.starIcon} />
                      Mặc định
                    </span>
                  )}
                </div>
                
                <div className={styles.cardActions}>
                  <button onClick={() => handleOpenEditModal(addr)} className={styles.actionBtn} title="Sửa">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Xóa">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                <p><strong>{addr.streetLine1}</strong></p>
                {addr.streetLine2 && <p>{addr.streetLine2}</p>}
                <p>{[addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}</p>
              </div>

              {!addr.default && (
                <div className={styles.cardFooter}>
                  <button onClick={() => handleSetDefault(addr.id)} className={styles.setDefaultBtn}>
                    Thiết lập mặc định
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddressFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingAddress}
        isLoading={isSubmitting}
      />
    </div>
  );
}
