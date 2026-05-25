import axios from 'axios';
import { CONFIG } from '../config';
import { DealPayload } from '../models/types';

export async function pushDealToBackend(payload: DealPayload): Promise<void> {
    try {
        const response = await axios.post(CONFIG.BACKEND_API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Crawler-Key': CONFIG.CRAWLER_API_KEY
            }
        });
        console.log('✅ Đã đẩy deal thành công:', response.data.message || 'OK');
    } catch (error: any) {
        if (error.response) {
            console.error('❌ Lỗi Backend:', error.response.status, error.response.data);
        } else {
            console.error('❌ Lỗi kết nối Backend:', error.message);
        }
        throw error;
    }
}
