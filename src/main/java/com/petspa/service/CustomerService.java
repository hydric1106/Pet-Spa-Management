package com.petspa.service;

import com.petspa.dto.CustomerDTO;
import com.petspa.dto.PetDTO;
import com.petspa.model.Customer;
import com.petspa.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Customer Service - Manages customer CRM data.
 */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    /**
     * Gets all customers.
     */
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets a customer by ID.
     */
    public CustomerDTO getCustomerById(Long id) {
        return customerRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
    }

    /**
     * Finds a customer by phone number.
     */
    public CustomerDTO findByPhoneNumber(String phoneNumber) {
        return customerRepository.findByPhoneNumber(phoneNumber)
                .map(this::toDTO)
                .orElse(null);
    }

    /**
     * Searches customers by phone number (partial match).
     */
    public List<CustomerDTO> searchByPhone(String phoneNumber) {
        return customerRepository.findByPhoneNumberContaining(phoneNumber).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Searches customers by name.
     */
    public List<CustomerDTO> searchByName(String name) {
        return customerRepository.findByFullNameContainingIgnoreCase(name).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Creates a new customer.
     */
    @Transactional
    public CustomerDTO createCustomer(CustomerDTO dto) {
        if (customerRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new RuntimeException("Phone number already exists: " + dto.getPhoneNumber());
        }

        Customer customer = Customer.builder()
                .fullName(dto.getFullName())
                .phoneNumber(dto.getPhoneNumber())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .build();

        Customer saved = customerRepository.save(customer);
        return toDTO(saved);
    }

    /**
     * Updates an existing customer.
     */
    @Transactional
    public CustomerDTO updateCustomer(CustomerDTO dto) {
        Customer customer = customerRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Customer not found: " + dto.getId()));

        customer.setFullName(dto.getFullName());
        customer.setPhoneNumber(dto.getPhoneNumber());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());

        Customer saved = customerRepository.save(customer);
        return toDTO(saved);
    }

    /**
     * Deletes a customer.
     */
    @Transactional
    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new RuntimeException("Customer not found: " + id);
        }
        customerRepository.deleteById(id);
    }

    /**
     * Converts Customer entity to CustomerDTO.
     */
    private CustomerDTO toDTO(Customer customer) {
        List<PetDTO> petDTOs = customer.getPets().stream()
                .map(pet -> PetDTO.builder()
                        .id(pet.getId())
                        .name(pet.getName())
                        .species(pet.getSpecies())
                        .breed(pet.getBreed())
                        .age(pet.getAge())
                        .weight(pet.getWeight())
                        .build())
                .collect(Collectors.toList());

        return CustomerDTO.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phoneNumber(customer.getPhoneNumber())
                .email(customer.getEmail())
                .address(customer.getAddress())
                .createdAt(customer.getCreatedAt())
                .pets(petDTOs)
                .totalBookings(customer.getBookings() != null ? customer.getBookings().size() : 0)
                .build();
    }
}
