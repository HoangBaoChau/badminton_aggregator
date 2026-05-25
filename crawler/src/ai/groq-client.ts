import Groq from 'groq-sdk';
import { CONFIG } from '../config';
import { RawPost, GroqDealResponse } from '../models/types';

const groq = new Groq({ apiKey: CONFIG.GROQ_API_KEY });

export async function analyzePost(post: RawPost): Promise<GroqDealResponse | null> {
    const prompt = `Bạn là chuyên gia phân tích dữ liệu thị trường cầu lông tại Việt Nam.
Đọc bài đăng Facebook sau và trích xuất thông tin thành JSON.

QUY TẮC:
1. Nếu KHÔNG PHẢI bài mua bán/trao đổi/pass đồ → "is_deal": false
2. Giá tiền (price) là SỐ NGUYÊN đơn vị VND: "399k"→399000, "2tr5"→2500000, "1xxx"→1000000. Không rõ → null
3. LOCATION: "tphcm/hcm/sg"→"TP.HCM", "hn/hà nội"→"Hà Nội", "đn/đà nẵng"→"Đà Nẵng". Đọc kỹ cả cuối bài.
4. CONDITION: "new/seal/fullbox"→"new", "97-99%/like new"→"like_new", "90%/9/10"→"90_percent", "80%/8/10"→"80_percent", "cũ/2nd"→"used"
5. Nhiều sản phẩm → chỉ lấy sản phẩm ĐẦU TIÊN.

JSON BẮT BUỘC:
{"is_deal":true/false,"productName":"string","price":number|null,"originalPrice":number|null,"condition":"new"|"like_new"|"90_percent"|"80_percent"|"used"|null,"location":"string"|null,"transactionMethod":"string"|null,"sellerName":"string"|null,"aiSummary":"string","tags":["string"],"metadata":{"weight":"string"|null,"flex":"string"|null,"size":"string"|null,"phone":"string"|null}}

Nội dung bài viết:
"""
${post.text}
"""`;

    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries <= MAX_RETRIES) {
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: CONFIG.GROQ_MODEL,
                temperature: 0.1,
                max_tokens: 1024,
                response_format: { type: 'json_object' },
            });

            const responseText = chatCompletion.choices[0]?.message?.content || '{}';
            return JSON.parse(responseText) as GroqDealResponse;
        } catch (error: any) {
            if (error?.status === 429 && retries < MAX_RETRIES) {
                retries++;
                const waitTime = retries * 5;
                console.warn(`⏳ Rate limit! Đợi ${waitTime}s rồi thử lại...`);
                await new Promise(r => setTimeout(r, waitTime * 1000));
            } else {
                console.error('❌ Lỗi Groq:', error?.message || error);
                return null;
            }
        }
    }
    return null;
}
