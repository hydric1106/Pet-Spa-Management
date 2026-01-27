package com.petspa.repository;

import com.petspa.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository for Booking entity.
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Find all bookings for a specific date.
     */
    List<Booking> findByBookingDate(LocalDate date);

    /**
     * Find bookings by customer ID.
     */
    List<Booking> findByCustomerId(Long customerId);

    /**
     * Find bookings by staff ID.
     */
    List<Booking> findByStaffId(Long staffId);

    /**
     * Find bookings by staff ID and date.
     */
    List<Booking> findByStaffIdAndBookingDate(Long staffId, LocalDate date);

    /**
     * Find bookings by status.
     */
    List<Booking> findByStatus(Booking.BookingStatus status);

    /**
     * Find bookings for a date range.
     */
    List<Booking> findByBookingDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find today's bookings for a staff member.
     */
    @Query("SELECT b FROM Booking b WHERE b.staff.id = :staffId AND b.bookingDate = :date ORDER BY b.bookingTime")
    List<Booking> findTodayBookingsForStaff(@Param("staffId") Long staffId, @Param("date") LocalDate date);
}
