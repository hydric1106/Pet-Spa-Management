package com.petspa.service;

import com.petspa.dto.UserDTO;
import com.petspa.model.User;
import com.petspa.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Authentication Service - Handles login/logout operations.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    /**
     * Authenticates a user with email and password.
     * 
     * @param email user's email
     * @param password user's password (plain text for now - should use BCrypt in production)
     * @return UserDTO if authentication successful, null otherwise
     */
    public UserDTO authenticate(String email, String password) {
        return userRepository.findByEmailAndIsActiveTrue(email)
                .filter(user -> user.getPassword().equals(password)) // TODO: Use BCrypt
                .map(this::toDTO)
                .orElse(null);
    }

    /**
     * Converts User entity to UserDTO.
     * Password is excluded from the response.
     */
    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
