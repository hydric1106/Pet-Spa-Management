package com.petspa.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for Customer entity.
 * Used for CRM data management.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerDTO {

    private Long id;
    private String fullName;
    private String phoneNumber;
    private String email;
    private String address;
    private LocalDateTime createdAt;
    
    // Nested data for convenience
    private List<PetDTO> pets;
    private Integer totalBookings;
}
