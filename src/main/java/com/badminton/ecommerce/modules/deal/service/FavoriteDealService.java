package com.badminton.ecommerce.modules.deal.service;

import com.badminton.ecommerce.modules.deal.dto.response.DealResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface FavoriteDealService {

    /**
     * Bật/Tắt trạng thái yêu thích của một deal cho người dùng.
     * @return true nếu đã yêu thích, false nếu đã hủy yêu thích.
     */
    boolean toggleFavorite(String email, UUID dealId);

    /**
     * Kiểm tra xem người dùng đã yêu thích deal này chưa.
     */
    boolean checkFavorite(String email, UUID dealId);

    /**
     * Lấy danh sách các deal đã yêu thích của người dùng (có phân trang).
     */
    Page<DealResponse> getUserFavorites(String email, int page, int size);
}
