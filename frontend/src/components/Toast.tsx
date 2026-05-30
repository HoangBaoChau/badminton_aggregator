import React, { useEffect, useState } from 'react';
import { CheckCircle, Info, XCircle, X } from 'lucide-react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(onClose, 300); // Wait for animation to finish
    }, 2700);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <CheckCircle className={styles.iconSuccess} size={20} />,
    error: <XCircle className={styles.iconError} size={20} />,
    info: <Info className={styles.iconInfo} size={20} />
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${isClosing ? styles.closing : ''}`}>
      <div className={styles.iconContainer}>
        {icons[type]}
      </div>
      <p className={styles.message}>{message}</p>
      <button onClick={handleClose} className={styles.closeBtn}>
        <X size={16} />
      </button>
    </div>
  );
}
