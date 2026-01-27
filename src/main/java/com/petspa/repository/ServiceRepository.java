package com.petspa.repository;

import com.petspa.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Service entity.
 */
@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {

    /**
     * Find all active services.
     */
    List<Service> findByIsActiveTrue();

    /**
     * Find service by name.
     */
    List<Service> findByNameContainingIgnoreCase(String name);
}
