package com.example.ecommerce.services;

import com.example.ecommerce.dto.order.CreateOrderRequest;
import com.example.ecommerce.dto.order.OrderItemResponse;
import com.example.ecommerce.dto.order.OrderResponse;
import com.example.ecommerce.entity.*;
import com.example.ecommerce.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            AddressRepository addressRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.addressRepository = addressRepository;
    }

    @Transactional
    public OrderResponse createOrder(
            CreateOrderRequest request,
            Long userId) {

        // 1. Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Get user's cart
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        // 3. Get cart items
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());

        // 4. Make sure cart is not empty
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // 5. Get address
        Address address = addressRepository
                .findByIdAndUserId(request.getAddressId(), userId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // 6. Create Order
        Order order = new Order();

        order.setUser(user);
        order.setAddress(address);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);

        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        // 7. Calculate total
        BigDecimal totalAmount = BigDecimal.ZERO;

        List<OrderItem> orderItems = new ArrayList<>();

        // 8. Convert CartItems → OrderItems
        for (CartItem cartItem : cartItems) {

            Product product = cartItem.getProduct();

            BigDecimal price = product.getPrice();

            Integer quantity = cartItem.getQuantity();

            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(quantity));

            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = new OrderItem(order, product, product.getName(), price, quantity, subtotal);

            orderItems.add(orderItem);
        }

        // 9. Set total
        order.setTotalAmount(totalAmount);

        // 10. Attach items to order
        order.setItems(orderItems);

        // 11. Save Order
        Order savedOrder = orderRepository.save(order);

        // 12. Clear cart
        cartItemRepository.deleteAll(cartItems);

        // 13. Convert to response
        List<OrderItemResponse> itemResponses = new ArrayList<>();

        for (OrderItem item : savedOrder.getItems()) {

            OrderItemResponse response = new OrderItemResponse(
                    item.getProduct().getId(),
                    item.getProductName(),
                    item.getPrice(),
                    item.getQuantity(),
                    item.getSubtotal());

            itemResponses.add(response);
        }

        return new OrderResponse(
                savedOrder.getId(),
                savedOrder.getStatus(),
                savedOrder.getPaymentStatus(),
                savedOrder.getTotalAmount(),
                savedOrder.getAddress().getId(),
                savedOrder.getCreatedAt(),
                itemResponses);
    }

    public List<OrderResponse> getUserOrders(Long userId) {

        List<Order> orders = orderRepository.findByUserId(userId);

        List<OrderResponse> responses = new ArrayList<>();

        for (Order order : orders) {

            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

            List<OrderItemResponse> itemResponses = new ArrayList<>();

            for (OrderItem item : items) {

                OrderItemResponse itemResponse = new OrderItemResponse(
                        item.getProduct().getId(),
                        item.getProductName(),
                        item.getPrice(),
                        item.getQuantity(),
                        item.getSubtotal());

                itemResponses.add(itemResponse);
            }

            OrderResponse response = new OrderResponse(
                    order.getId(),
                    order.getStatus(),
                    order.getPaymentStatus(),
                    order.getTotalAmount(),
                    order.getAddress().getId(),
                    order.getCreatedAt(),
                    itemResponses);

            responses.add(response);
        }

        return responses;
    }

    public OrderResponse getOrder(
            Long orderId,
            Long userId) {

        Order order = orderRepository
                .findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

        List<OrderItemResponse> itemResponses = new ArrayList<>();

        for (OrderItem item : items) {

            OrderItemResponse response = new OrderItemResponse(
                    item.getProduct().getId(),
                    item.getProductName(),
                    item.getPrice(),
                    item.getQuantity(),
                    item.getSubtotal());

            itemResponses.add(response);
        }

        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getTotalAmount(),
                order.getAddress().getId(),
                order.getCreatedAt(),
                itemResponses);
    }
}