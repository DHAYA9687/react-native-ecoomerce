package com.example.ecommerce.dto.order;

public class CreateOrderRequest {

    private Long addressId;

    private String paymentMethod;

    private String deliveryMethod;

    public CreateOrderRequest(Long addressId, String paymentMethod, String deliveryMethod) {
        this.addressId = addressId;
        this.paymentMethod = paymentMethod;
        this.deliveryMethod = deliveryMethod;
    }

    public Long getAddressId() {
        return addressId;
    }

    public void setAddressId(Long addressId) {
        this.addressId = addressId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getDeliveryMethod() {
        return deliveryMethod;
    }

    public void setDeliveryMethod(String deliveryMethod) {
        this.deliveryMethod = deliveryMethod;
    }

}