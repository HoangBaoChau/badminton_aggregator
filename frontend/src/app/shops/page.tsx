"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import styles from './Shops.module.css';
import { Search, MapPin, Phone, Navigation } from 'lucide-react';

// Import LeafletMap dynamically with ssr: false because it relies on window
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
      <div className="animate-spin w-10 h-10 border-4 border-slate-300 border-t-primary rounded-full mb-4"></div>
      <p className="text-slate-500">Đang tải bản đồ...</p>
    </div>
  )
});

const HANOI_CENTER: [number, number] = [21.0285, 105.8542];

// Custom icons
const customIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const activeIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ShopsPage() {
  const [userLocation, setUserLocation] = useState<[number, number]>(HANOI_CENTER);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // Debounce search input to trigger search automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput.trim());
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 1. Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          console.log("User denied geolocation, using default Hanoi center.");
        }
      );
    }
  }, []);

  // 2. Fetch shops from our Backend API
  useEffect(() => {
    const fetchShops = async () => {
      setIsLoading(true);
      try {
        let url = 'http://localhost:8080/api/v1/shops?city=Hà Nội';
        if (keyword) {
          url += `&q=${encodeURIComponent(keyword)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch shops');
        
        const json = await response.json();
        if (json.status === 200 && Array.isArray(json.data)) {
          setShops(json.data);
        } else {
          setShops([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu shop:", error);
        setShops([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, [keyword]);



  const getDirectionsUrl = (shop: any) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.name + ', ' + shop.address)}`;
  };

  // Center the map either on selected shop, user location, or default Hanoi
  const getMapCenter = (): [number, number] => {
    if (selectedShopId) {
      const selectedShop = shops.find(s => s.id === selectedShopId);
      if (selectedShop) return [selectedShop.latitude, selectedShop.longitude];
    }
    return userLocation;
  };

  return (
    <div className={styles.shopsPage}>
      {/* Top Search Bar */}
      <form className={styles.searchBar} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.searchInputWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Tìm shop (VNB, QVB, Tiến Dinh Sport...)" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </form>

      <div className={styles.mainContent}>
        {/* Left Sidebar - List */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>{isLoading ? 'Đang tìm...' : `${shops.length} cửa hàng được tìm thấy`}</h2>
          </div>
          
          <div className={styles.shopList}>
            {isLoading ? (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner}></div>
                <span>Đang tải dữ liệu shop...</span>
              </div>
            ) : shops.length === 0 ? (
              <div className={styles.emptyState}>
                <MapPin size={40} opacity={0.5} style={{ marginBottom: 16 }} />
                <h3>Không tìm thấy kết quả</h3>
                <p>Thử mở rộng từ khóa tìm kiếm xem sao.</p>
              </div>
            ) : (
              shops.map((shop) => (
                <div 
                  key={shop.id} 
                  className={`${styles.shopCard} ${selectedShopId === shop.id ? styles.active : ''}`}
                  onClick={() => setSelectedShopId(shop.id)}
                >
                  <div className={`${styles.shopImage} flex items-center justify-center bg-slate-100 dark:bg-slate-800`}>
                    <MapPin size={30} className={selectedShopId === shop.id ? "text-yellow-500" : "text-red-500"} />
                  </div>
                  
                  <div className={styles.shopInfo}>
                    <h3 className={styles.shopName} title={shop.name}>{shop.name}</h3>
                    
                    <div className={styles.shopMeta}>
                      <span className={`${styles.openStatus} ${styles.open}`}>
                        {shop.brand}
                      </span>
                    </div>
                    
                    <div className={styles.shopAddress} title={shop.address}>
                      <MapPin size={14} />
                      <span className="line-clamp-2">{shop.address}</span>
                    </div>

                    {shop.phone && (
                      <div className={styles.shopAddress}>
                        <Phone size={14} />
                        <span>{shop.phone}</span>
                      </div>
                    )}

                    <div className={styles.shopActions}>
                      <a 
                        href={getDirectionsUrl(shop)}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`${styles.actionBtn} ${styles.primary}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation size={14} /> Chỉ đường
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area - Map */}
        <div className={styles.mapArea}>
          <LeafletMap center={getMapCenter()} zoom={selectedShopId ? 16 : 13}>
            {/* User Location Marker */}
            <Marker position={userLocation} icon={userIcon}>
              <Popup>Vị trí của bạn</Popup>
            </Marker>

            {/* Shop Markers */}
            {shops.map((shop) => (
              <Marker 
                key={shop.id} 
                position={[shop.latitude, shop.longitude]}
                icon={selectedShopId === shop.id ? activeIcon : customIcon}
                eventHandlers={{
                  click: () => setSelectedShopId(shop.id)
                }}
              >
                <Popup>
                  <div className={styles.infoWindow}>
                    <h3>{shop.name}</h3>
                    <p className={styles.infoAddress}>{shop.address}</p>
                    {shop.phone && <p className="text-sm mt-1">SĐT: <strong>{shop.phone}</strong></p>}
                    <a 
                      href={getDirectionsUrl(shop)}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-blue-500 hover:underline text-sm font-medium"
                    >
                      Chỉ đường trên Google Maps
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LeafletMap>
        </div>
      </div>
    </div>
  );
}
