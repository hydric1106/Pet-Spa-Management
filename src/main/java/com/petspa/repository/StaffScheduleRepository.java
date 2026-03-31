package com.petspa.repository;

import com.petspa.model.StaffSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Repository for StaffSchedule entity.
 */
@Repository
public interface StaffScheduleRepository extends JpaRepository<StaffSchedule, Long> {

    /**
     * Find all schedules for a staff member.
     */
    List<StaffSchedule> findByStaffId(Long staffId);

    /**
     * Find schedules for a specific day of the week.
     */
    List<StaffSchedule> findByDayOfWeek(Integer dayOfWeek);

       /**
        * Find schedules for a specific date.
        */
       List<StaffSchedule> findByScheduleDate(LocalDate scheduleDate);

    /**
     * Find staff working on a specific day.
     */
    @Query("SELECT ss FROM StaffSchedule ss " +
           "JOIN FETCH ss.staff s " +
           "JOIN FETCH ss.shiftType st " +
           "WHERE ss.dayOfWeek = :dayOfWeek AND s.isActive = true")
    List<StaffSchedule> findActiveStaffByDayOfWeek(@Param("dayOfWeek") Integer dayOfWeek);

    /**
     * Find staff available on a specific date and time.
     */
    @Query("SELECT ss FROM StaffSchedule ss " +
           "JOIN FETCH ss.staff s " +
           "JOIN FETCH ss.shiftType st " +
           "WHERE ss.scheduleDate = :scheduleDate " +
           "AND st.startTime <= :time AND st.endTime > :time " +
           "AND s.isActive = true")
    List<StaffSchedule> findAvailableStaffByDate(@Param("scheduleDate") LocalDate scheduleDate,
                                            @Param("time") LocalTime time);

    /**
     * Check if a schedule already exists.
     */
    boolean existsByStaffIdAndDayOfWeekAndShiftTypeId(Long staffId, Integer dayOfWeek, Integer shiftTypeId);

       /**
        * Check if a date-specific schedule already exists.
        */
       boolean existsByStaffIdAndScheduleDateAndShiftTypeId(Long staffId, LocalDate scheduleDate, Integer shiftTypeId);

    /**
     * Delete all schedules for a staff member.
     */
    void deleteByStaffId(Long staffId);
}
