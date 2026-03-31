package com.petspa.repository;

import com.petspa.model.BookingStaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for booking-staff assignment records.
 */
@Repository
public interface BookingStaffAssignmentRepository extends JpaRepository<BookingStaffAssignment, Long> {

    List<BookingStaffAssignment> findByBookingId(Long bookingId);

    void deleteByBookingId(Long bookingId);
}
