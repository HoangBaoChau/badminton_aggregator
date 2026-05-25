package com.badminton.ecommerce.modules.deal.service.impl;

import com.badminton.ecommerce.core.exception.AppException;
import com.badminton.ecommerce.core.exception.ErrorCode;
import com.badminton.ecommerce.modules.deal.dto.response.DealResponse;
import com.badminton.ecommerce.modules.deal.entity.Deal;
import com.badminton.ecommerce.modules.deal.entity.FavoriteDeal;
import com.badminton.ecommerce.modules.deal.mapper.DealMapper;
import com.badminton.ecommerce.modules.deal.repository.DealRepository;
import com.badminton.ecommerce.modules.deal.repository.FavoriteDealRepository;
import com.badminton.ecommerce.modules.deal.service.FavoriteDealService;
import com.badminton.ecommerce.modules.identity.entity.User;
import com.badminton.ecommerce.modules.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteDealServiceImpl implements FavoriteDealService {

    private final FavoriteDealRepository favoriteDealRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;
    private final DealMapper dealMapper;

    @Override
    @Transactional
    public boolean toggleFavorite(String email, UUID dealId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new AppException(ErrorCode.DEAL_NOT_FOUND));

        Optional<FavoriteDeal> existingFavorite = favoriteDealRepository.findByUserIdAndDealId(user.getId(), dealId);

        if (existingFavorite.isPresent()) {
            favoriteDealRepository.deleteByUserIdAndDealId(user.getId(), dealId);
            log.info("User {} unfavorited deal {}", email, dealId);
            return false;
        } else {
            FavoriteDeal favoriteDeal = FavoriteDeal.builder()
                    .userId(user.getId())
                    .deal(deal)
                    .build();
            favoriteDealRepository.save(favoriteDeal);
            log.info("User {} favorited deal {}", email, dealId);
            return true;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkFavorite(String email, UUID dealId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return favoriteDealRepository.existsByUserIdAndDealId(user.getId(), dealId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DealResponse> getUserFavorites(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<FavoriteDeal> favoriteDealsPage = favoriteDealRepository.findByUserId(user.getId(), pageable);

        return favoriteDealsPage.map(favoriteDeal -> dealMapper.toResponse(favoriteDeal.getDeal()));
    }
}
