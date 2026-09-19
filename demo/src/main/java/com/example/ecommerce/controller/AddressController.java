package com.example.ecommerce.controller;

import com.example.ecommerce.dto.address.AddressRequest;
import com.example.ecommerce.entity.Address;
import com.example.ecommerce.services.AddressService;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @PostMapping
    public Address createAddress(
            @RequestBody AddressRequest request,
            @RequestParam Long userId
    ) {
        return addressService.createAddress(
                request,
                userId
        );
    }

    @GetMapping
    public List<Address> getAddresses(
            @RequestParam Long userId
    ) {
        return addressService.getUserAddresses(userId);
    }

    @DeleteMapping("/{addressId}")
    public void deleteAddress(
            @PathVariable Long addressId,
            @RequestParam Long userId
    ) {
        addressService.deleteAddress(
                addressId,
                userId
        );
    }
}