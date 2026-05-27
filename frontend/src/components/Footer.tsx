import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerContainer}`}>
        <div className={styles.brand}>
          <h3>🏸 BadmintonDeals</h3>
          <p>Nền tảng tổng hợp deal cầu lông uy tín hàng đầu Việt Nam.</p>
        </div>
        
        <div className={styles.links}>
          <div className={styles.linkGroup}>
            <h4>Về Chúng Tôi</h4>
            <a href="#">Giới thiệu</a>
            <a href="#">Liên hệ</a>
          </div>
          <div className={styles.linkGroup}>
            <h4>Hỗ Trợ</h4>
            <a href="#">Điều khoản sử dụng</a>
            <a href="#">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
      <div className={styles.copyright}>
        <p>&copy; {new Date().getFullYear()} BadmintonDeals. All rights reserved.</p>
      </div>
    </footer>
  );
}
