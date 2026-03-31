package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * StaffSchedule Entity - Assigns shifts to staff members.
 * 
 * This stores an exact scheduled date:
 * - schedule_date: the specific calendar date for this shift
 * - day_of_week: ISO weekday value derived from schedule_date
 * - shift_type_id: References the ShiftType (Morning, Afternoon, etc.)
 */
@Entity
@Table(name = "staff_schedule", 
       uniqueConstraints = @UniqueConstraint(
           name = "unique_schedule",
           columnNames = {"staff_id", "schedule_date", "shift_type_id"}
       ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The staff member this schedule belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private User staff;

    /**
     * The type of shift (Morning, Afternoon, etc.)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_type_id", nullable = false)
    private ShiftType shiftType;

    /**
     * Exact date of this shift assignment.
     */
    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;

    /**
     * Day of the week (1 = Monday, 7 = Sunday), denormalized for compatibility.
     */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;
}
