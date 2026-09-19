package com.example.ecommerce.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.repository.WishlistItemRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.entity.WishlistItem;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.repository.ProductRepository;
import java.util.*;

@Service
public class WishListService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final WishlistItemRepository wishlistItemRepository;

    public WishListService(UserRepository userRepository, ProductRepository productRepository,
            WishlistItemRepository wishlistItemRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.wishlistItemRepository = wishlistItemRepository;
    }

    public void addToWishList(Long userId, Long productId) {
        // Logic to add a product to the user's wishlist
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Optional<WishlistItem> existingItem = wishlistItemRepository.findByUserIdAndProductId(userId, productId);
        if (existingItem.isPresent()) {
            // If the product already exists in the wishlist, you can choose to do nothing
            // or throw an exception
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Product is already in wishlist");
        }

        WishlistItem wishlistItem = new WishlistItem(user, product);
        wishlistItemRepository.save(wishlistItem);
    }

    public void removeFromWishList(Long userId, Long productId) {
        // Logic to remove a product from the user's wishlist

        WishlistItem wishlistItem = wishlistItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new RuntimeException("Wishlist item not found"));

        wishlistItemRepository.delete(wishlistItem);

    }

    public List<WishlistItem> getWishList(Long userId) {
        // Logic to retrieve the user's wishlist
        return wishlistItemRepository.findByUserId(userId);

    }

}
