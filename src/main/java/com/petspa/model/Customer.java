package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Customer Entity - Represents pet owners (CRM data).
 * 
 * Customers are NOT system users - they cannot login.
 * They are managed by Admin through the CRM interface.
 * 
 * Key fields:
 * - phone_number: Primary identifier for customer lookup at POS
 * - email: Optional contact information
 * - address: For delivery or record keeping
 */
@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * One customer can have many pets.
     * Cascade delete: When customer is deleted, their pets are also deleted.
     */
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Pet> pets = new ArrayList<>();

    /**
     * One customer can have many bookings.
     */
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Booking> bookings = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Helper method to add a pet to this customer.
     */
    public void addPet(Pet pet) {
        pets.add(pet);
        pet.setOwner(this);
    }

    /**
     * Helper method to remove a pet from this customer.
     */
    public void removePet(Pet pet) {
        pets.remove(pet);
        pet.setOwner(null);
    }
}
