"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Deal } from './DealCard';
import styles from './DealMap.module.css';
import Link from 'next/link';

// Sửa lỗi icon marker mặc định của Leaflet khi dùng với webpack/nextjs
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component hỗ trợ center map dựa trên mảng tọa độ
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

interface DealMapClientProps {
  deals: Deal[];
  center?: [number, number]; // [lat, lng]
}

// Bảng tọa độ giả định cho các quận/huyện ở HN & TPHCM (vì Geocoding API free giới hạn)
const LOCATION_COORDS: Record<string, [number, number]> = {
  // Hà Nội
  'cầu giấy': [21.0362, 105.7906],
  'đống đa': [21.0152, 105.8239],
  'ba đình': [21.0345, 105.8209],
  'hoàn kiếm': [21.0285, 105.8542],
  'hai bà trưng': [21.0115, 105.8524],
  'thanh xuân': [20.9934, 105.8149],
  'hoàng mai': [20.9702, 105.8450],
  'long biên': [21.0427, 105.8824],
  'hà đông': [20.9715, 105.7725],
  'tây hồ': [21.0660, 105.8123],
  'nam từ liêm': [21.0125, 105.7600],
  'bắc từ liêm': [21.0683, 105.7533],
  
  // TPHCM
  'quận 1': [10.7769, 106.7009],
  'quận 2': [10.7872, 106.7495],
  'quận 3': [10.7813, 106.6857],
  'quận 4': [10.7588, 106.7051],
  'quận 5': [10.7540, 106.6631],
  'quận 6': [10.7483, 106.6352],
  'quận 7': [10.7326, 106.7222],
  'quận 10': [10.7735, 106.6663],
  'tân bình': [10.8015, 106.6526],
  'bình thạnh': [10.8105, 106.7091],
  'gò vấp': [10.8260, 106.6635],
  'phú nhuận': [10.7997, 106.6811],
  'thủ đức': [10.8494, 106.7537]
};

const getCoordsFromLocation = (location: string | undefined): [number, number] | null => {
  if (!location) return null;
  const lowerLoc = location.toLowerCase();
  for (const key of Object.keys(LOCATION_COORDS)) {
    if (lowerLoc.includes(key)) {
      // Cộng trừ thêm 1 chút random để các marker không đè lên nhau nếu cùng quận
      const randLat = (Math.random() - 0.5) * 0.01;
      const randLng = (Math.random() - 0.5) * 0.01;
      const coords = LOCATION_COORDS[key];
      return [coords[0] + randLat, coords[1] + randLng];
    }
  }
  return null; // Không tìm thấy
};

export default function DealMapClient({ deals, center = [21.0285, 105.8542] }: DealMapClientProps) { // Mặc định center Hà Nội
  
  // Lọc ra các deal có tọa độ
  const mapDeals = deals.map(d => ({
    ...d,
    coords: getCoordsFromLocation(d.location)
  })).filter(d => d.coords !== null);

  const mapCenter = mapDeals.length > 0 ? mapDeals[0].coords : center;

  return (
    <div className={styles.mapContainer}>
      <MapContainer 
        center={mapCenter as [number, number]} 
        zoom={12} 
        scrollWheelZoom={true} 
        className={styles.leafletMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapCenter && <ChangeView center={mapCenter as [number, number]} />}
        
        {mapDeals.map((deal) => (
          <Marker 
            key={deal.id} 
            position={deal.coords as [number, number]} 
            icon={icon}
          >
            <Popup className={styles.customPopup}>
              <div className={styles.popupContent}>
                {deal.thumbnailUrl && (
                  <img src={deal.thumbnailUrl} alt={deal.productName} className={styles.popupImg} />
                )}
                <h4 className={styles.popupTitle}>{deal.productName}</h4>
                <div className={styles.popupPrice}>{deal.price.toLocaleString('vi-VN')} đ</div>
                <div className={styles.popupLoc}>{deal.location}</div>
                <a href={deal.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.popupLink}>
                  Xem chi tiết
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {mapDeals.length === 0 && (
        <div className={styles.noDataOverlay}>
          Các deal hiện tại không có thông tin khu vực cụ thể để hiển thị trên bản đồ.
        </div>
      )}
    </div>
  );
}
