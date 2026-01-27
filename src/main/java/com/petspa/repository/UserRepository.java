package com.petspa.repository;

import com.petspa.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity (Admin/Staff accounts).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email (for login).
     */
    Optional<User> findByEmail(String email);

    /**
     * Find user by email and check if active.
     */
    Optional<User> findByEmailAndIsActiveTrue(String email);

    /**
     * Find all users by role.
     */
    List<User> findByRole(User.Role role);

    /**
     * Find all active users.
     */
    List<User> findByIsActiveTrue();

    /**
     * Find all active staff members.
     */
    List<User> findByRoleAndIsActiveTrue(User.Role role);

    /**
     * Check if email already exists.
     */
    boolean existsByEmail(String email);
}
