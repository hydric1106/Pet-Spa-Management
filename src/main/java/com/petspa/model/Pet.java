package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Pet Entity - Represents pets owned by customers.
 * 
 * Each pet belongs to exactly one customer (owner).
 * Pets receive services through bookings.
 */
@Entity
@Table(name = "pets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The customer who owns this pet.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private Customer owner;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 50)
    private String species;  // Dog, Cat, Bird, etc.

    @Column(length = 50)
    private String breed;

    private Integer age;

    private Float weight;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
