package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * User Entity - Represents Admin and Staff accounts.
 * 
 * This table is ONLY for system users who can login:
 * - ADMIN: Full access to manage everything
 * - STAFF: Limited access to view their schedule and assigned tasks
 * 
 * Note: Customers are NOT users - they are stored in a separate Customer entity.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * User roles in the system.
     */
    public enum Role {
        ADMIN,  // Full system access
        STAFF   // Limited access - view schedule and tasks only
    }
}
