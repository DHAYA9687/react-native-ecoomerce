package com.example.ecommerce.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import com.example.ecommerce.entity.WishlistItem;
import com.example.ecommerce.services.WishListService;
import org.springframework.http.ResponseEntity;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/wishlist")
public class WishListController {

    private final AuthController authController;
    private final WishListService wishListService;

    public WishListController(WishListService wishListService, AuthController authController) {
        this.wishListService = wishListService;
        this.authController = authController;
    }

    @PostMapping("/{productId}")
    public ResponseEntity<String> addToWishlist(@PathVariable Long productId, @RequestParam Long userId) {
        try {
            wishListService.addToWishList(userId, productId);
            return ResponseEntity.ok("Product added to wishlist successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }

    @PostMapping("/remove/{productId}")
    public ResponseEntity<String> removeFromWishlist(@PathVariable Long productId, @RequestParam Long userId) {
        try {
            wishListService.removeFromWishList(userId, productId);
            return ResponseEntity.ok("Product removed from wishlist successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public List<WishlistItem> getWishlist(
            @RequestParam Long userId) {

        List<WishlistItem> wishlistItems = wishListService.getWishList(userId);
        if (wishlistItems.isEmpty()) {
            throw new RuntimeException("Wishlist is empty");
        }
        return wishlistItems;

    }

}
