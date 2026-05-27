import axios from 'axios';

// Cấu hình URL mặc định, lấy từ biến môi trường (nếu có)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Request: Attach Token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor Response
apiClient.interceptors.response.use(
  (response) => response.data?.data || response.data,
  (error) => {
    console.error("API Error:", error);

    // Xử lý lỗi Token hết hạn hoặc Không có quyền (401, 403)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        // Xóa thông tin đăng nhập cũ
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Phát tín hiệu mở Popup đẹp (SessionExpiredModal)
        window.dispatchEvent(new Event('session_expired'));
      }
    }

    return Promise.reject(error);
  }
);

// SWR Fetcher
export const fetcher = (url: string) => apiClient.get(url);
