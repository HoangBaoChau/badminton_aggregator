import { apiClient } from './api';

export const systemConfigApi = {
  getConfig: async (key: string) => {
    try {
      const response = await apiClient.get(`/system-configs/${key}`);
      return response.data; // { key: string, value: string }
    } catch (error) {
      console.error(`Lỗi khi lấy config ${key}:`, error);
      return null;
    }
  },

  updateConfig: async (key: string, value: string, description?: string) => {
    try {
      const response = await apiClient.put(`/system-configs/${key}`, { value, description });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật config ${key}:`, error);
      throw error;
    }
  }
};
