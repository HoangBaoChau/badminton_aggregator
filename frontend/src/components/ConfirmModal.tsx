import React from 'react';
import styles from './ConfirmModal.module.css';
import { AlertCircle, Trash2, CheckCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <Trash2 size={24} className={styles.iconDanger} />;
      case 'info': return <CheckCircle size={24} className={styles.iconInfo} />;
      default: return <AlertCircle size={24} className={styles.iconWarning} />;
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onCancel}>
          <X size={20} />
        </button>
        
        <div className={styles.header}>
          <div className={`${styles.iconContainer} ${styles[`iconContainer-${type}`]}`}>
            {getIcon()}
          </div>
          <h2 className={styles.title}>{title}</h2>
        </div>
        
        <div className={styles.body}>
          <p>{message}</p>
        </div>
        
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`${styles.confirmBtn} ${styles[`confirmBtn-${type}`]}`}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
