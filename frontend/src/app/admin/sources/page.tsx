"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher, apiClient } from '@/services/api';
import styles from './AdminSources.module.css';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  Check,
  X,
  Play,
  ScrollText
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SourceForm {
  name: string;
  type: string;
  url: string;
  crawlFrequencyMinutes: number;
  active: boolean;
}

export default function AdminSourcesPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('fb_group');
  const [url, setUrl] = useState('');
  const [frequency, setFrequency] = useState(60);
  const [maxScrolls, setMaxScrolls] = useState(5);
  const [active, setActive] = useState(true);

  // Crawl Trigger State
  const [crawlModalOpen, setCrawlModalOpen] = useState(false);
  const [crawlingSource, setCrawlingSource] = useState<any | null>(null);
  const [crawlScrolls, setCrawlScrolls] = useState(5);
  const [toastMsg, setToastMsg] = useState('');

  // Fetch sources paginated
  const { data, error, isLoading, mutate } = useSWR<any>(`/admin/sources?page=${page}&size=10`, fetcher, {
    keepPreviousData: true
  });

  const sources = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const openAddModal = () => {
    setEditingSource(null);
    setName('');
    setType('fb_group');
    setUrl('');
    setFrequency(60);
    setMaxScrolls(5);
    setActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (source: any) => {
    setEditingSource(source);
    setName(source.name);
    setType(source.type);
    setUrl(source.url);
    setFrequency(source.crawlFrequencyMinutes);
    setMaxScrolls(source.maxScrolls || 5);
    setActive(source.active);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url || !frequency) {
      setErrorMsg('Vui lòng nhập đầy đủ các trường thông tin');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingSource) {
        // Update Source
        await apiClient.put(`/admin/sources/${editingSource.id}`, {
          name,
          url,
          crawlFrequencyMinutes: Number(frequency),
          maxScrolls: Number(maxScrolls),
          active
        });
      } else {
        // Create Source
        await apiClient.post('/admin/sources', {
          name,
          type,
          url,
          crawlFrequencyMinutes: Number(frequency),
          maxScrolls: Number(maxScrolls)
        });
      }
      setIsModalOpen(false);
      mutate();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Lưu nguồn tin thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlingSource) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/admin/sources/${crawlingSource.id}/crawl?maxScrolls=${crawlScrolls}`);
      setCrawlModalOpen(false);
      setToastMsg(`🚀 Tiến trình Crawler cho "${crawlingSource.name}" đã được khởi chạy ngầm!`);
      setTimeout(() => setToastMsg(''), 5000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi khi kích hoạt crawler!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sourceId: string, sourceName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nguồn cào "${sourceName}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/sources/${sourceId}`);
      mutate();
    } catch (err) {
      console.error("Lỗi khi xóa nguồn cào:", err);
      alert("Xóa nguồn cào thất bại. Vui lòng thử lại!");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Nguồn Thu Thập Dữ Liệu</h1>
          <p className={styles.subtitle}>Cấu hình và kiểm soát các hội nhóm, trang web để bot tự động cào tin</p>
        </div>
        <button onClick={openAddModal} className={styles.addBtn}>
          <Plus size={18} />
          <span>Thêm nguồn mới</span>
        </button>
      </div>

      {/* Main Table */}
      {error && (
        <div className={styles.emptyContainer} style={{ borderColor: '#ef4444' }}>
          <AlertCircle size={40} className="text-red-500 mb-4" />
          <h2 className={styles.emptyTitle}>Có lỗi xảy ra</h2>
          <p className={styles.emptyText}>Không thể tải danh sách các nguồn cào tin từ máy chủ.</p>
        </div>
      )}

      {!error && sources.length === 0 && !isLoading && (
        <div className={styles.emptyContainer}>
          <div className="text-4xl mb-4">🔗</div>
          <h2 className={styles.emptyTitle}>Chưa cấu hình nguồn cào nào</h2>
          <p className={styles.emptyText}>Bấm nút "Thêm nguồn mới" ở góc trên bên phải để bắt đầu.</p>
        </div>
      )}

      {!error && (sources.length > 0 || isLoading) && (
        <div className={styles.sourcesTableWrapper}>
          {isLoading && !data ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="animate-spin text-blue-500" size={40} />
            </div>
          ) : (
            <table className={styles.sourcesTable}>
              <thead>
                <tr>
                  <th>Tên Nguồn</th>
                  <th>Loại</th>
                  <th>Địa chỉ URL</th>
                  <th>Tần suất cào (phút)</th>
                  <th>Cuộn trang</th>
                  <th>Lần cào cuối</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source: any) => (
                  <tr key={source.id}>
                    <td>
                      <span className={styles.sourceName}>{source.name}</span>
                    </td>
                    <td>
                      <code className="bg-slate-800 text-xs px-2 py-1 rounded text-orange-400">
                        {source.type === 'fb_group' ? 'Facebook Group' :
                         source.type === 'website' ? 'Website' :
                         source.type === 'shopee' ? 'Shopee' :
                         source.type === 'lazada' ? 'Lazada' :
                         source.type === 'vnb' ? 'VNB Shop' : 'Khác'}
                      </code>
                    </td>
                    <td>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className={styles.sourceUrl}>
                        <span>Truy cập liên kết</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td>{source.crawlFrequencyMinutes} phút</td>
                    <td>{source.maxScrolls || 5} lần</td>
                    <td>
                      <span className="text-gray-500 text-xs">
                        {source.lastCrawledAt 
                          ? new Date(source.lastCrawledAt).toLocaleString('vi-VN') 
                          : 'Chưa thực hiện'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        source.active ? styles.statusActive : styles.statusInactive
                      }`}>
                        {source.active ? 'Đang bật' : 'Đang tắt'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        {source.active && (
                          <button
                            onClick={() => {
                              setCrawlingSource(source);
                              setCrawlScrolls(source.maxScrolls || 5);
                              setCrawlModalOpen(true);
                            }}
                            className={`${styles.actionBtn} ${styles.btnCrawl}`}
                            title="Kích hoạt quét ngay"
                          >
                            <Play size={14} />
                            <span>Chạy</span>
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/admin/logs?sourceId=${source.id}`)}
                          className={`${styles.actionBtn} ${styles.btnLogs}`}
                          title="Xem nhật ký hệ thống"
                        >
                          <ScrollText size={14} />
                          <span>Logs</span>
                        </button>
                        <button
                          onClick={() => openEditModal(source)}
                          className={`${styles.actionBtn} ${styles.btnEdit}`}
                          title="Sửa nguồn tin"
                        >
                          <Edit2 size={14} />
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={() => handleDelete(source.id, source.name)}
                          className={`${styles.actionBtn} ${styles.btnDelete}`}
                          title="Xóa nguồn tin"
                        >
                          <Trash2 size={14} />
                          <span>Xóa</span>
                        </button>
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
                Hiển thị {sources.length} / {totalElements} nguồn cào (Trang {page + 1} / {totalPages})
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editingSource ? 'Cập Nhật Nguồn Cào' : 'Thêm Nguồn Cào Mới'}
            </h2>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Tên Nguồn Tin</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Vợt Cầu Lông Cũ Hà Nội"
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {!editingSource && (
                <div className={styles.formGroup}>
                  <label>Loại Nguồn</label>
                  <select
                    className={styles.select}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="fb_group">Facebook Group</option>
                    <option value="website">Website (HTML)</option>
                    <option value="shopee">Shopee</option>
                    <option value="lazada">Lazada</option>
                    <option value="vnb">VNB Shop</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Địa Chỉ URL</label>
                <input
                  type="text"
                  placeholder="https://facebook.com/groups/..."
                  className={styles.input}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tần Suất Cào (phút)</label>
                <input
                  type="number"
                  min="5"
                  className={styles.input}
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Số lần cuộn trang (maxScrolls)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={styles.input}
                  value={maxScrolls}
                  onChange={(e) => setMaxScrolls(Number(e.target.value))}
                />
              </div>

              {editingSource && (
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="active" className={styles.checkboxLabel}>
                    Kích hoạt nguồn tin này
                  </label>
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.btnCancel}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Lưu Lại</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crawl Confirm Modal */}
      {crawlModalOpen && crawlingSource && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>🚀 Kích Hoạt Quét Crawler</h2>
            <p className="text-gray-300 text-sm mb-4">
              Bạn đang chuẩn bị kích hoạt tiến trình cào dữ liệu ngầm cho nguồn <strong className="text-white">{crawlingSource.name}</strong>.
            </p>
            <form onSubmit={handleTriggerCrawl} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Số lần cuộn trang tạm thời (cho phiên này)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={styles.input}
                  value={crawlScrolls}
                  onChange={(e) => setCrawlScrolls(Number(e.target.value))}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setCrawlModalOpen(false)}
                  className={styles.btnCancel}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  style={{ backgroundColor: '#10b981' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                  <span>Bắt Đầu Cào</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className={styles.toastContainer}>
          <Check size={20} className="text-white" />
          <span className={styles.toastText}>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
