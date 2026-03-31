package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * BookingStaffAssignment Entity - Links bookings to assigned staff members.
 */
@Entity
@Table(name = "booking_staff_assignments",
       uniqueConstraints = @UniqueConstraint(
           name = "unique_booking_staff_assignment",
           columnNames = {"booking_id", "staff_id"}
       ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingStaffAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private User staff;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
