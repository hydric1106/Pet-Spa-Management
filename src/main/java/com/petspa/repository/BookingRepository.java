package com.petspa.repository;

import com.petspa.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
     * Find bookings assigned to a staff member (legacy staff field or assignment table).
     */
    @Query("SELECT DISTINCT b FROM Booking b LEFT JOIN b.staffAssignments sa " +
            "WHERE (b.staff IS NOT NULL AND b.staff.id = :staffId) OR sa.staff.id = :staffId")
    List<Booking> findByAssignedStaffId(@Param("staffId") Long staffId);

    /**
     * Find bookings by assigned staff and date.
     */
    @Query("SELECT DISTINCT b FROM Booking b LEFT JOIN b.staffAssignments sa " +
            "WHERE b.bookingDate = :date AND ((b.staff IS NOT NULL AND b.staff.id = :staffId) OR sa.staff.id = :staffId)")
    List<Booking> findByAssignedStaffIdAndBookingDate(@Param("staffId") Long staffId, @Param("date") LocalDate date);

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
    @Query("SELECT DISTINCT b FROM Booking b LEFT JOIN b.staffAssignments sa " +
           "WHERE b.bookingDate = :date AND ((b.staff IS NOT NULL AND b.staff.id = :staffId) OR sa.staff.id = :staffId) " +
           "ORDER BY b.bookingTime")
    List<Booking> findTodayBookingsForStaff(@Param("staffId") Long staffId, @Param("date") LocalDate date);

        /**
         * Sum booking revenue for a day excluding a given status.
         */
        @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE b.bookingDate = :date AND b.status <> :excludedStatus")
        BigDecimal sumRevenueByDateExcludingStatus(@Param("date") LocalDate date,
                                                                                           @Param("excludedStatus") Booking.BookingStatus excludedStatus);
}
