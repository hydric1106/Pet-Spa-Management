package com.petspa.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for User entity.
 * Used for transferring user data between Java and JavaScript.
 * 
 * Note: Password is excluded from responses for security.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {

    private Long id;
    private String email;
    private String password;  // Only used for create/update, never returned
    private String fullName;
    private String phoneNumber;
    private String role;      // "ADMIN" or "STAFF"
    private Boolean isActive;
    private LocalDateTime createdAt;
}
