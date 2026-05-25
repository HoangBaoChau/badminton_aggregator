import { v2 as cloudinary } from 'cloudinary';
import { CONFIG } from '../config';

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: CONFIG.CLOUDINARY.CLOUD_NAME,
    api_key: CONFIG.CLOUDINARY.API_KEY,
    api_secret: CONFIG.CLOUDINARY.API_SECRET,
});

/**
 * Tải ảnh từ URL (thường là Facebook CDN) lên Cloudinary
 * Có tự động nén, đổi sang webp và resize tối đa 800px.
 */
export async function uploadImageToCloudinary(imageUrl: string, postId: string): Promise<string | null> {
    if (!imageUrl) return null;
    
    // Nếu chưa config Cloudinary thì bỏ qua để không lỗi, vẫn dùng link gốc
    if (!CONFIG.CLOUDINARY.CLOUD_NAME || !CONFIG.CLOUDINARY.API_KEY || !CONFIG.CLOUDINARY.API_SECRET) {
        console.warn('⚠️ Chưa cấu hình Cloudinary. Bỏ qua bước upload ảnh.');
        return imageUrl; 
    }

    try {
        console.log(`📤 Đang upload ảnh lên Cloudinary cho post ${postId}...`);
        
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
            folder: 'badminton_deals', // Thư mục trên Cloudinary
            public_id: `deal_${postId}`, // Tên file
            overwrite: true,
            
            // Ép ảnh hiển thị tối ưu nhất cho web
            format: 'webp',
            quality: 'auto',
            
            // Giới hạn kích thước tối đa (giảm dung lượng)
            width: 800,
            crop: 'limit', 
            
            // Hẹn giờ tự xóa ảnh rác sau 90 ngày (tùy chọn, hiện comment lại)
            // type: "upload", 
            // access_mode: "public"
        });

        console.log(`✅ Upload thành công: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;
        
    } catch (error: any) {
        console.error(`❌ Lỗi upload Cloudinary: ${error.message || error}`);
        // Fallback: Nếu upload lỗi, vẫn trả về link Facebook gốc để không mất bài
        return imageUrl;
    }
}
