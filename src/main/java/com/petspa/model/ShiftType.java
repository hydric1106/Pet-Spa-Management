package com.petspa.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * ShiftType Entity - Defines types of work shifts.
 * 
 * Examples:
 * - Morning: 08:00 - 12:00
 * - Afternoon: 13:00 - 17:00
 */
@Entity
@Table(name = "shift_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
}
