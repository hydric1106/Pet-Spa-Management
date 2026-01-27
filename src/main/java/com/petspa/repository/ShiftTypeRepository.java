package com.petspa.repository;

import com.petspa.model.ShiftType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for ShiftType entity.
 */
@Repository
public interface ShiftTypeRepository extends JpaRepository<ShiftType, Integer> {

    /**
     * Find shift type by name.
     */
    Optional<ShiftType> findByName(String name);
}
