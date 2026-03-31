package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Booking Entity - Represents a service booking/appointment.
 * 
 * A booking connects:
 * - Customer (who is paying)
 * - Pet (who receives the service)
 * - Staff (who performs the service)
 * - Services (what is being done - via BookingDetail)
 */
@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The customer making the booking.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    /**
     * The pet receiving the service.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    /**
     * The staff member assigned to perform the service.
     * Can be null if not yet assigned.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private User staff;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "booking_time", nullable = false)
    private LocalTime bookingTime;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "total_price", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * The services included in this booking.
     */
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingDetail> bookingDetails = new ArrayList<>();

    /**
     * Staff assignments for this booking (supports one-to-many staff assignment).
     */
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingStaffAssignment> staffAssignments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Helper method to add a service to this booking.
     */
    public void addBookingDetail(BookingDetail detail) {
        bookingDetails.add(detail);
        detail.setBooking(this);
        recalculateTotalPrice();
    }

    /**
     * Replaces staff assignments with the given staff list.
     */
    public void setAssignedStaff(List<User> staffList) {
        staffAssignments.clear();

        if (staffList == null || staffList.isEmpty()) {
            this.staff = null;
            return;
        }

        Set<Long> seenIds = new LinkedHashSet<>();
        for (User assignedStaff : staffList) {
            if (assignedStaff == null || assignedStaff.getId() == null || !seenIds.add(assignedStaff.getId())) {
                continue;
            }

            BookingStaffAssignment assignment = BookingStaffAssignment.builder()
                    .booking(this)
                    .staff(assignedStaff)
                    .build();
            staffAssignments.add(assignment);
        }

        this.staff = staffAssignments.isEmpty() ? null : staffAssignments.get(0).getStaff();
    }

    /**
     * Recalculates the total price based on booking details.
     */
    public void recalculateTotalPrice() {
        this.totalPrice = bookingDetails.stream()
                .map(BookingDetail::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Booking status values.
     */
    public enum BookingStatus {
        PENDING,    // Waiting for confirmation
        CONFIRMED,  // Confirmed and scheduled
        IN_PROGRESS,// Currently being serviced
        COMPLETED,  // Service completed
        CANCELLED   // Booking was cancelled
    }
}
