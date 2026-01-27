package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * StaffSchedule Entity - Assigns shifts to staff members.
 * 
 * This creates a weekly recurring schedule:
 * - day_of_week: 1 (Monday) to 7 (Sunday)
 * - shift_type_id: References the ShiftType (Morning, Afternoon, etc.)
 */
@Entity
@Table(name = "staff_schedule", 
       uniqueConstraints = @UniqueConstraint(
           name = "unique_schedule",
           columnNames = {"staff_id", "day_of_week", "shift_type_id"}
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
     * Day of the week (1 = Monday, 7 = Sunday).
     * Following ISO-8601 standard.
     */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;
}
