package com.petspa.repository;

import com.petspa.model.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for BookingDetail entity.
 */
@Repository
public interface BookingDetailRepository extends JpaRepository<BookingDetail, Long> {

    /**
     * Find all details for a booking.
     */
    List<BookingDetail> findByBookingId(Long bookingId);

    /**
     * Find all bookings that include a specific service.
     */
    List<BookingDetail> findByServiceId(Long serviceId);
}
