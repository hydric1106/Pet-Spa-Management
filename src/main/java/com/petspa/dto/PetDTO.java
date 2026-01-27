package com.petspa.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for Pet entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetDTO {

    private Long id;
    private Long ownerId;
    private String ownerName;  // Denormalized for display
    private String name;
    private String species;
    private String breed;
    private Integer age;
    private Float weight;
    private String notes;
    private LocalDateTime createdAt;
}
