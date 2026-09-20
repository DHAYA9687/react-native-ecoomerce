package com.example.ecommerce.controller;

import com.example.ecommerce.dto.order.CreateOrderRequest;
import com.example.ecommerce.dto.order.OrderResponse;
import com.example.ecommerce.services.OrderService;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse createOrder(
            @RequestBody CreateOrderRequest request,
            @RequestParam Long userId) {

        return orderService.createOrder(
                request,
                userId);
    }

    @GetMapping
    public List<OrderResponse> getOrders(
            @RequestParam Long userId) {
        return orderService.getUserOrders(userId);
    }

    @GetMapping("/{orderId}")
    public OrderResponse getOrder(
            @PathVariable Long orderId,
            @RequestParam Long userId) {

        return orderService.getOrder(
                orderId,
                userId);
    }
}