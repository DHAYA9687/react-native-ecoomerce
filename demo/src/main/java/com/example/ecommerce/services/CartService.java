package com.example.ecommerce.services;

import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.entity.Cart;
import com.example.ecommerce.entity.CartItem;
import com.example.ecommerce.entity.Product;

import org.springframework.stereotype.Service;

import com.example.ecommerce.dto.auth.ApiResponse;
import com.example.ecommerce.dto.cart.CartItemResponse;
import com.example.ecommerce.dto.cart.CartRequest;
import com.example.ecommerce.dto.cart.CartResponse;
import com.example.ecommerce.repository.CartItemRepository;
import com.example.ecommerce.repository.UserRepository;
import java.util.*;
import com.example.ecommerce.repository.ProductRepository;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository, UserRepository userRepository,
            CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    public CartResponse addToCart(CartRequest request) {
        // 1. Find the user's cart
        Cart cart = cartRepository
                .findByUserId(request.getUserId())
                .orElseGet(() -> {

                    User user = userRepository
                            .findById(request.getUserId())
                            .orElseThrow(() -> new RuntimeException("User not found"));

                    Cart newCart = new Cart();
                    newCart.setUser(user);

                    return cartRepository.save(newCart);
                });

        // 2. Add the product to the cart
        // (Implementation for adding product to cart goes here)
        // 2. Find whether this product already exists in the cart
        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(
                cart.getId(),
                request.getProductId());

        if (existingItem.isPresent()) {
            // If the product already exists in the cart, update the quantity
            CartItem cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());
            cartItemRepository.save(cartItem);
        } else {
            // If the product does not exist in the cart, create a new CartItem
            Product product = productRepository
                    .findById(request.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            CartItem newCartItem = new CartItem();
            newCartItem.setCart(cart);
            newCartItem.setProduct(product);
            newCartItem.setQuantity(request.getQuantity());
            cartItemRepository.save(newCartItem);
        }

        return buildCartResponse(cart);
    }

    public CartResponse getCartByUserId(Long userId) {
        Cart cart = cartRepository
                .findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user with ID: " + userId));
        return buildCartResponse(cart);
    }

    public ApiResponse updateCartItemQuantity(Long cartId, Long productId, int quantity) {
        CartItem cartItem = cartItemRepository.findByCartIdAndProductId(cartId, productId)
                .orElseThrow(() -> new RuntimeException("Cart item not found for cart ID: " + cartId + " and product ID: " + productId));

        if (quantity <= 0) {
            // If the quantity is zero or negative, remove the item from the cart
            cartItemRepository.delete(cartItem);
            return new ApiResponse(true, "Item removed from cart");
        } else {
            // Otherwise, update the quantity
            cartItem.setQuantity(quantity);
            cartItemRepository.save(cartItem);
            return new ApiResponse(true, "Item quantity updated");
        }
    }

    public ApiResponse removeCartItem(Long cartId, Long productId) {
        CartItem cartItem = cartItemRepository.findByCartIdAndProductId(cartId, productId)
                .orElseThrow(() -> new RuntimeException("Cart item not found for cart ID: " + cartId + " and product ID: " + productId));

        cartItemRepository.delete(cartItem);
        return new ApiResponse(true, "Item removed from cart");
    }

    private CartResponse buildCartResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());

        List<CartItemResponse> itemResponses = new ArrayList<>();
        for (CartItem item : items) {
            // item.getProduct() already gives us the associated product via
            // the CartItem's relation - no need for a second lookup.
            CartItemResponse response = new CartItemResponse(
                    item.getProduct().getId(),
                    item.getProduct().getName(),
                    item.getProduct().getPrice(),
                    item.getQuantity(),
                    item.getProduct().getImageUrl());

            itemResponses.add(response);
        }

        return new CartResponse(
                cart.getId(),
                cart.getUser().getId(),
                itemResponses);
    }

}
