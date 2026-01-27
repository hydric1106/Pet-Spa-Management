package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Service Entity - Represents spa services offered.
 * 
 * Examples: Bathing, Grooming, Nail Trimming, etc.
 */
@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
