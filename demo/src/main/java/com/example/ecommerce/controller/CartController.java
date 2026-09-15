package com.example.ecommerce.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.ecommerce.services.CartService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.example.ecommerce.dto.cart.CartRequest;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.example.ecommerce.dto.cart.CartResponse;
import org.springframework.web.bind.annotation.PutMapping;
import com.example.ecommerce.dto.auth.ApiResponse;
import com.example.ecommerce.dto.cart.UpdateCartItemRequest;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/add")
    public ResponseEntity<CartResponse> addToCart(@RequestBody CartRequest entity) {
        CartResponse cart = cartService.addToCart(entity);
        if (cart == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(cart);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<CartResponse> getCartByUserId(@PathVariable Long userId) {
        CartResponse cart = cartService.getCartByUserId(userId);
        if (cart == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/items/{cartId}")
    public ResponseEntity<ApiResponse> updateCartItem(@PathVariable Long cartId,
            @RequestBody UpdateCartItemRequest request) {
        ApiResponse response = cartService.updateCartItemQuantity(cartId, request.getProductId(),
                request.getQuantity());
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping ("/{cartId}/items/{productId}")
    public ResponseEntity<ApiResponse> removeCartItem(@PathVariable Long cartId, @PathVariable Long productId) {
        ApiResponse response = cartService.removeCartItem(cartId, productId);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

}
