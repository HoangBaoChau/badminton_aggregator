"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, Zap, ShieldCheck, Search } from 'lucide-react';
import styles from './Landing.module.css';

export default function LandingPage() {
  const features = [
    {
      icon: <Bot size={28} />,
      title: 'Bot Cào Tin Thông Minh',
      desc: 'Hệ thống tự động quét và thu thập hàng ngàn deal cầu lông từ các hội nhóm Facebook mỗi ngày.'
    },
    {
      icon: <Zap size={28} />,
      title: 'Phân Tích Bằng AI',
      desc: 'Tích hợp Groq AI để đọc hiểu bài viết, phân loại tình trạng, trích xuất giá và thông tin người bán chuẩn xác.'
    },
    {
      icon: <ShieldCheck size={28} />,
      title: 'Kiểm Duyệt Nghiêm Ngặt',
      desc: 'Công cụ Admin Dashboard mạnh mẽ giúp loại bỏ các bài đăng rác, lừa đảo, đảm bảo môi trường mua bán sạch.'
    },
    {
      icon: <Search size={28} />,
      title: 'Tìm Kiếm Dễ Dàng',
      desc: 'Bộ lọc nâng cao theo thương hiệu, loại sản phẩm và từ khóa giúp bạn tìm thấy món đồ ưng ý trong chớp mắt.'
    }
  ];

  return (
    <div className={styles.container}>
      {/* Background glow effect */}
      <div className={styles.backgroundGlow}></div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <Bot size={16} />
          <span>Hệ thống tự động tổng hợp Deal Cầu Lông</span>
        </div>
        
        <h1 className={styles.title}>
          Săn sale đồ cầu lông <br />
          <span className={styles.highlight}>Đỉnh Cao & Nhanh Chóng</span>
        </h1>
        
        <p className={styles.subtitle}>
          Đừng bỏ lỡ bất kỳ cơ hội sở hữu vợt, giày và phụ kiện chính hãng với giá tốt nhất. 
          BadmintonDeals sử dụng AI để mang hàng ngàn bài đăng từ Facebook đến màn hình của bạn theo thời gian thực.
        </p>

        <div className={styles.ctaGroup}>
          <Link href="/deals" className={styles.primaryBtn}>
            Khám Phá Deals Ngay
            <ArrowRight size={20} />
          </Link>
          <Link href="/register" className={styles.secondaryBtn}>
            Đăng Ký Thành Viên
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Tại Sao Chọn BadmintonDeals?</h2>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                {feature.icon}
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
