import React, { useState, useEffect, useCallback } from 'react';
import styles from './FilterBar.module.css';
import { Filter, MapPin, Tag, Box, Clock, DollarSign, Activity, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  onSearch: (filters: { 
    keyword: string; 
    categoryId: string; 
    brandId: string;
    location?: string;
    transactionMethod?: string;
    timeRange?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
  categories?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
}

export default function FilterBar({ onSearch, categories = [], brands = [] }: FilterBarProps) {
  const [productType, setProductType] = useState('');  // keyword cho loại sản phẩm
  const [location, setLocation] = useState('');
  const [transactionMethod, setTransactionMethod] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [brand, setBrand] = useState('');  // keyword cho thương hiệu
  const [condition, setCondition] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);

  // Gộp keyword = productType + brand thành 1 chuỗi tìm kiếm
  const buildKeyword = useCallback(() => {
    const parts = [productType, brand].filter(Boolean);
    return parts.join(' ');
  }, [productType, brand]);

  // Auto-submit khi bất kỳ filter nào thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch({
        keyword: buildKeyword(),
        categoryId: '',
        brandId: '',
        location: location || undefined,
        transactionMethod: transactionMethod || undefined,
        timeRange: timeRange || undefined,
        condition: condition || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 10000000 ? priceRange[1] : undefined,
      });
    }, 400); // Debounce 400ms

    return () => clearTimeout(timer);
  }, [productType, location, transactionMethod, timeRange, brand, condition, priceRange]);

  const formatPrice = (value: number) => {
    if (value === 0) return '0đ';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}tr`;
    if (value >= 1000) return `${value / 1000}k`;
    return `${value}đ`;
  };

  const handleReset = () => {
    setProductType('');
    setLocation('');
    setTransactionMethod('');
    setTimeRange('');
    setBrand('');
    setCondition('');
    setPriceRange([0, 10000000]);
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterHeader}>
        <Filter size={20} className={styles.headerIcon} />
        <h3>Bộ lọc chi tiết</h3>
        <button type="button" onClick={handleReset} className={styles.resetBtn} title="Xóa tất cả bộ lọc">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className={styles.filterBody}>
        {/* Loại sản phẩm - Dùng keyword thay vì UUID */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            <Box size={14} /> Loại sản phẩm
          </label>
          <select 
            className={styles.selectField}
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="vợt">🏸 Vợt cầu lông</option>
            <option value="giày">👟 Giày cầu lông</option>
            <option value="quần áo">👕 Quần áo</option>
            <option value="balo túi">🎒 Balo / Túi</option>
            <option value="cầu">🏐 Quả cầu</option>
            <option value="phụ kiện">🔧 Phụ kiện khác</option>
          </select>
        </div>

        {/* Khu vực */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            <MapPin size={14} /> Khu vực
          </label>
          <input
            type="text"
            placeholder="VD: Cầu Giấy, Long Biên..."
            className={styles.inputField}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Cột 2 Layout cho Giao dịch & Thương hiệu */}
        <div className={styles.grid2Col}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <Tag size={14} /> Loại giao dịch
            </label>
            <select 
              className={styles.selectField}
              value={transactionMethod}
              onChange={(e) => setTransactionMethod(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="ban">Bán</option>
              <option value="mua">Cần mua</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <Activity size={14} /> Thương hiệu
            </label>
            <select 
              className={styles.selectField}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="yonex">Yonex</option>
              <option value="victor">Victor</option>
              <option value="lining">Lining</option>
              <option value="mizuno">Mizuno</option>
              <option value="apacs">Apacs</option>
              <option value="kumpoo">Kumpoo</option>
            </select>
          </div>
        </div>

        {/* Thời gian đăng */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            <Clock size={14} /> Thời gian đăng
          </label>
          <select 
            className={styles.selectField}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="">Tất cả (không lọc)</option>
            <option value="1h">1 giờ qua</option>
            <option value="24h">24 giờ qua</option>
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
          </select>
        </div>

        {/* Tình trạng */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            <Box size={14} /> Tình trạng
          </label>
          <select 
            className={styles.selectField}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="">Tất cả tình trạng</option>
            <option value="new">Mới 100%</option>
            <option value="likenew">Như mới (99%)</option>
            <option value="used">Đã sử dụng</option>
          </select>
        </div>

        {/* Khoảng giá */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            <DollarSign size={14} /> Khoảng giá
          </label>
          <div className={styles.priceSliderWrapper}>
            <input 
              type="range" 
              min="0" 
              max="10000000" 
              step="100000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
              className={styles.rangeInput}
            />
            <div className={styles.priceLabels}>
              <span>0đ</span>
              <span className={styles.currentPrice}>{formatPrice(priceRange[1])}</span>
              <span>10tr+</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
