package com.example.ecommerce.repository;

import com.example.ecommerce.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistItemRepository
        extends JpaRepository<WishlistItem, Long> {

    Optional<WishlistItem> findByUserIdAndProductId(
            Long userId,
            Long productId
    );

    List<WishlistItem> findByUserId(Long userId);
}