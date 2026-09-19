package com.example.ecommerce.services;

import com.example.ecommerce.dto.address.AddressRequest;
import com.example.ecommerce.entity.Address;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.repository.AddressRepository;
import com.example.ecommerce.repository.UserRepository;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(
            AddressRepository addressRepository,
            UserRepository userRepository
    ) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public Address createAddress(
            AddressRequest request,
            Long userId
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Address address = new Address();

        address.setUser(user);
        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setAddressLine(request.getAddressLine());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());

        return addressRepository.save(address);
    }

    public void deleteAddress(
            Long addressId,
            Long userId
    ) {

        Address address = addressRepository
                .findByIdAndUserId(addressId, userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Address not found"
                        ));

        addressRepository.delete(address);
    }

    public List<Address> getUserAddresses(Long userId) {

        return addressRepository.findByUserId(userId);
    }
}