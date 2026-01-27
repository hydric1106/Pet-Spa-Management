package com.petspa.dto;

import lombok.*;

import java.time.LocalTime;

/**
 * Data Transfer Object for ShiftType entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftTypeDTO {

    private Integer id;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
}
