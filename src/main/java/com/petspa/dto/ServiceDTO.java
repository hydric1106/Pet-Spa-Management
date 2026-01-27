package com.petspa.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * Data Transfer Object for Service entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDTO {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer durationMinutes;
    private Boolean isActive;
}
