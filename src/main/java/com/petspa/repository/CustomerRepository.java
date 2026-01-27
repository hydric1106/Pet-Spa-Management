package com.petspa.repository;

import com.petspa.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Customer entity (CRM data).
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    /**
     * Find customer by phone number.
     * Phone number is the primary lookup field at POS.
     */
    Optional<Customer> findByPhoneNumber(String phoneNumber);

    /**
     * Find customers by phone number containing (partial match).
     */
    List<Customer> findByPhoneNumberContaining(String phoneNumber);

    /**
     * Find customers by name containing (partial match, case-insensitive).
     */
    List<Customer> findByFullNameContainingIgnoreCase(String name);

    /**
     * Check if phone number already exists.
     */
    boolean existsByPhoneNumber(String phoneNumber);
}
