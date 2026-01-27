package com.petspa.service;

import com.petspa.dto.UserDTO;
import com.petspa.model.User;
import com.petspa.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * User Service - Manages Admin and Staff accounts.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Gets all users.
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets all active users.
     */
    public List<UserDTO> getActiveUsers() {
        return userRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets all staff members.
     */
    public List<UserDTO> getAllStaff() {
        return userRepository.findByRoleAndIsActiveTrue(User.Role.STAFF).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets a user by ID.
     */
    public UserDTO getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    /**
     * Creates a new user.
     */
    @Transactional
    public UserDTO createUser(UserDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already exists: " + dto.getEmail());
        }

        User user = User.builder()
                .email(dto.getEmail())
                .password(dto.getPassword()) // TODO: Use BCrypt
                .fullName(dto.getFullName())
                .phoneNumber(dto.getPhoneNumber())
                .role(User.Role.valueOf(dto.getRole()))
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        return toDTO(saved);
    }

    /**
     * Updates an existing user.
     */
    @Transactional
    public UserDTO updateUser(UserDTO dto) {
        User user = userRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("User not found: " + dto.getId()));

        user.setFullName(dto.getFullName());
        user.setPhoneNumber(dto.getPhoneNumber());
        
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(dto.getPassword()); // TODO: Use BCrypt
        }
        
        if (dto.getRole() != null) {
            user.setRole(User.Role.valueOf(dto.getRole()));
        }

        User saved = userRepository.save(user);
        return toDTO(saved);
    }

    /**
     * Deactivates a user (soft delete).
     */
    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        user.setIsActive(false);
        userRepository.save(user);
    }

    /**
     * Reactivates a user.
     */
    @Transactional
    public void reactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        user.setIsActive(true);
        userRepository.save(user);
    }

    /**
     * Converts User entity to UserDTO.
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
