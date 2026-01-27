package com.petspa.dto;

import lombok.*;

/**
 * Data Transfer Object for StaffSchedule entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffScheduleDTO {

    private Long id;
    
    // Staff info
    private Long staffId;
    private String staffName;
    
    // Shift info
    private Integer shiftTypeId;
    private String shiftName;
    private String startTime;
    private String endTime;
    
    // Schedule
    private Integer dayOfWeek;
    private String dayName;  // "Monday", "Tuesday", etc.
}
