package com.example.ecommerce.repository;

import com.example.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
import org.springframework.data.jpa.repository.Query;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartIdAndProductId(
            Long cartId,
            Long productId);

    @Query("SELECT c FROM CartItem c WHERE c.cart.id = :cartId")
    List<CartItem> findByCartId(Long cartId);

    @Query("DELETE FROM CartItem c WHERE c.cart.id = :cartId")
    void deleteByCartId(Long cartId);
}
