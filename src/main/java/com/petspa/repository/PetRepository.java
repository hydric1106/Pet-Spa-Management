package com.petspa.repository;

import com.petspa.model.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Pet entity.
 */
@Repository
public interface PetRepository extends JpaRepository<Pet, Long> {

    /**
     * Find all pets belonging to a customer.
     */
    List<Pet> findByOwnerId(Long ownerId);

    /**
     * Find pets by species.
     */
    List<Pet> findBySpecies(String species);

    /**
     * Find pets by name containing (partial match).
     */
    List<Pet> findByNameContainingIgnoreCase(String name);
}
