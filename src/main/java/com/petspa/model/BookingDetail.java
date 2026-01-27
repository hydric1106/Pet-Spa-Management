package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * BookingDetail Entity - Links bookings to services.
 * 
 * This is a junction table that also stores the price at the time of booking
 * (in case service prices change later).
 */
@Entity
@Table(name = "booking_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The booking this detail belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    /**
     * The service being provided.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    /**
     * Price at the time of booking.
     * This preserves the price even if the service price changes later.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}
