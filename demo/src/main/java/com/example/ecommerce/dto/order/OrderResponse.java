package com.example.ecommerce.dto.order;

import com.example.ecommerce.entity.OrderStatus;
import com.example.ecommerce.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponse {

    private Long orderId;

    private OrderStatus status;

    private PaymentStatus paymentStatus;

    private BigDecimal totalAmount;

    private Long addressId;

    private LocalDateTime createdAt;

    private List<OrderItemResponse> items;

    public OrderResponse(
            Long orderId,
            OrderStatus status,
            PaymentStatus paymentStatus,
            BigDecimal totalAmount,
            Long addressId,
            LocalDateTime createdAt,
            List<OrderItemResponse> items
    ) {
        this.orderId = orderId;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.totalAmount = totalAmount;
        this.addressId = addressId;
        this.createdAt = createdAt;
        this.items = items;
    }

    public Long getOrderId() {
        return orderId;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public Long getAddressId() {
        return addressId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }
}