"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/services/api';
import styles from './AdminLogs.module.css';
import { 
  RefreshCw, 
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function AdminLogsPage() {
  const searchParams = useSearchParams();
  const initialSourceId = searchParams.get('sourceId') || '';

  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [sourceId, setSourceId] = useState(initialSourceId);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch all sources to construct mapping of sourceId -> sourceName and fill the dropdown filter
  const { data: sourcesData } = useSWR<any>('/admin/sources?size=100', fetcher);
  const sources = sourcesData?.content || [];
  
  // Construct lookup map
  const sourceMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    sources.forEach((s: any) => {
      map[s.id] = s.name;
    });
    return map;
  }, [sources]);

  // Build query URL for logs
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: '15'
  });
  if (status) queryParams.append('status', status);
  if (sourceId) queryParams.append('sourceId', sourceId);

  const { data, error, isLoading } = useSWR<any>(`/admin/logs?${queryParams.toString()}`, fetcher, {
    keepPreviousData: true
  });

  const logs = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const toggleExpandLog = (logId: string) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(logId);
    }
  };

  const handleStatusFilterChange = (val: string) => {
    setStatus(val);
    setPage(0);
    setExpandedLogId(null);
  };

  const handleSourceFilterChange = (val: string) => {
    setSourceId(val);
    setPage(0);
    setExpandedLogId(null);
  };

  const formatDuration = (ms: number) => {
    if (!ms) return '0s';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nhật Ký Hoạt Động (Crawl Logs)</h1>
        <p className={styles.subtitle}>Giám sát lịch sử và chi tiết các phiên cào tin của hệ thống</p>
      </header>

      {/* Filter Options */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label>Trạng Thái Lượt Cào</label>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="success">Thành công (success)</option>
            <option value="failed">Thất bại (failed)</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Nguồn Cào Dữ Liệu</label>
          <select
            className={styles.select}
            value={sourceId}
            onChange={(e) => handleSourceFilterChange(e.target.value)}
          >
            <option value="">Tất cả nguồn tin</option>
            {sources.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {error && (
        <div className={styles.emptyContainer} style={{ borderColor: '#ef4444' }}>
          <AlertCircle size={40} className="text-red-500 mb-4" />
          <h2 className={styles.emptyTitle}>Có lỗi xảy ra</h2>
          <p className={styles.emptyText}>Không thể tải nhật ký cào tin từ máy chủ.</p>
        </div>
      )}

      {!error && logs.length === 0 && !isLoading && (
        <div className={styles.emptyContainer}>
          <div className="text-4xl mb-4">📜</div>
          <h2 className={styles.emptyTitle}>Không có nhật ký nào</h2>
          <p className={styles.emptyText}>Chưa có lượt cào tin nào khớp với bộ lọc của bạn.</p>
        </div>
      )}

      {!error && (logs.length > 0 || isLoading) && (
        <div className={styles.logsTableWrapper}>
          {isLoading && !data ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="animate-spin text-blue-500" size={40} />
            </div>
          ) : (
            <table className={styles.logsTable}>
              <thead>
                <tr>
                  <th>Thời Gian</th>
                  <th>Nguồn Cào</th>
                  <th>Trạng Thái</th>
                  <th>Kết Quả Cào</th>
                  <th>Thời Gian Chạy</th>
                  <th>Thông Tin Thêm</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => {
                  const sourceName = sourceMap[log.sourceId] || 'Không xác định';
                  const isExpanded = expandedLogId === log.id;
                  
                  return (
                    <React.Fragment key={log.id}>
                      <tr>
                        <td>
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold text-white" title={log.sourceId}>
                            {sourceName}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${
                            log.status?.toLowerCase() === 'success' ? styles.statusSuccess : styles.statusFailed
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          {log.status?.toLowerCase() === 'success' ? (
                            <div className={styles.statsText}>
                              <span className={styles.statNew}>+{log.postsNew} bài mới</span>
                              <span className={styles.statDuplicate}>{log.postsDuplicate} bài trùng (Tổng: {log.postsFound})</span>
                            </div>
                          ) : (
                            <span className="text-red-500 text-xs">Cào tin thất bại</span>
                          )}
                        </td>
                        <td>{formatDuration(log.durationMs)}</td>
                        <td>
                          {(log.crawlDetails || log.errorMessage) ? (
                            <button 
                              onClick={() => toggleExpandLog(log.id)}
                              className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr className={styles.errorExpandedRow}>
                          <td colSpan={6}>
                            <div className={styles.errorContent}>
                              {log.errorMessage && (
                                <div style={{ marginBottom: '12px' }}>
                                  <strong style={{ color: '#ef4444' }}>❌ Lỗi:</strong>
                                  <pre style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>{log.errorMessage}</pre>
                                </div>
                              )}
                              {log.crawlDetails && (
                                <div>
                                  <strong style={{ color: '#10b981' }}>📦 Dữ liệu đã đẩy vào DB ({JSON.parse(log.crawlDetails).length} deal):</strong>
                                  <pre style={{ whiteSpace: 'pre-wrap', marginTop: '4px', maxHeight: '400px', overflow: 'auto', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                                    {JSON.stringify(JSON.parse(log.crawlDetails), null, 2)}
                                  </pre>
                                </div>
                              )}
                              {!log.errorMessage && !log.crawlDetails && (
                                <span>Không có thông tin chi tiết.</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.pageInfo}>
                Hiển thị {logs.length} / {totalElements} lượt chạy (Trang {page + 1} / {totalPages})
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
