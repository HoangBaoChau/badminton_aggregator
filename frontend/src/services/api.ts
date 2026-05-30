import axios from 'axios';

// Cấu hình URL mặc định, lấy từ biến môi trường (nếu có) hoặc tự động phát hiện theo IP/domain hiện tại
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8080/api/v1`;
  }
  return 'http://localhost:8080/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
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

// SWR Fetcher
export const fetcher = (url: string) => apiClient.get(url);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor Response
apiClient.interceptors.response.use(
  (response) => response.data?.data || response.data,
  async (error) => {
    const originalRequest = error.config;

    // Xử lý lỗi Token hết hạn hoặc Không có quyền (401, 403)
    if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
      if (typeof window === 'undefined') return Promise.reject(error);
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken || window.location.pathname === '/login') {
        // Không có refresh token hoặc đang ở trang login thì logout luôn
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('session_expired'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Đang có 1 request refresh token khác chạy, xếp hàng chờ
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: refreshToken
        });

        // Backend trả về data.data.accessToken do bọc trong ApiResponse
        const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
        const newRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken;
        
        localStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Chạy lại request gốc
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        
        // Refresh token thất bại -> bắt đăng nhập lại
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('session_expired'));
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
