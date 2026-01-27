package com.petspa.service;

import com.petspa.dto.ShiftTypeDTO;
import com.petspa.dto.StaffScheduleDTO;
import com.petspa.dto.UserDTO;
import com.petspa.model.ShiftType;
import com.petspa.model.StaffSchedule;
import com.petspa.model.User;
import com.petspa.repository.ShiftTypeRepository;
import com.petspa.repository.StaffScheduleRepository;
import com.petspa.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Schedule Service - Manages staff schedules and shifts.
 */
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final StaffScheduleRepository scheduleRepository;
    private final ShiftTypeRepository shiftTypeRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ISO_LOCAL_TIME;

    /**
     * Gets all shift types.
     */
    public List<ShiftTypeDTO> getAllShiftTypes() {
        return shiftTypeRepository.findAll().stream()
                .map(this::toShiftTypeDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets schedule for a specific staff member.
     */
    public List<StaffScheduleDTO> getScheduleByStaffId(Long staffId) {
        return scheduleRepository.findByStaffId(staffId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets available staff for a specific date and time.
     */
    public List<UserDTO> getAvailableStaff(String dateStr, String timeStr) {
        LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalTime time = LocalTime.parse(timeStr, TIME_FORMATTER);
        
        // Get day of week (1 = Monday, 7 = Sunday)
        int dayOfWeek = date.getDayOfWeek().getValue();
        
        List<StaffSchedule> schedules = scheduleRepository.findAvailableStaff(dayOfWeek, time);
        
        return schedules.stream()
                .map(schedule -> toUserDTO(schedule.getStaff()))
                .collect(Collectors.toList());
    }

    /**
     * Gets all staff working on a specific day.
     */
    public List<StaffScheduleDTO> getStaffByDay(Integer dayOfWeek) {
        return scheduleRepository.findActiveStaffByDayOfWeek(dayOfWeek).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Assigns a shift to a staff member.
     */
    @Transactional
    public StaffScheduleDTO assignShift(StaffScheduleDTO dto) {
        // Check if schedule already exists
        if (scheduleRepository.existsByStaffIdAndDayOfWeekAndShiftTypeId(
                dto.getStaffId(), dto.getDayOfWeek(), dto.getShiftTypeId())) {
            throw new RuntimeException("Schedule already exists for this staff, day, and shift");
        }

        User staff = userRepository.findById(dto.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found: " + dto.getStaffId()));
        
        ShiftType shiftType = shiftTypeRepository.findById(dto.getShiftTypeId())
                .orElseThrow(() -> new RuntimeException("Shift type not found: " + dto.getShiftTypeId()));

        StaffSchedule schedule = StaffSchedule.builder()
                .staff(staff)
                .shiftType(shiftType)
                .dayOfWeek(dto.getDayOfWeek())
                .build();

        StaffSchedule saved = scheduleRepository.save(schedule);
        return toDTO(saved);
    }

    /**
     * Removes a schedule entry.
     */
    @Transactional
    public void removeSchedule(Long scheduleId) {
        if (!scheduleRepository.existsById(scheduleId)) {
            throw new RuntimeException("Schedule not found: " + scheduleId);
        }
        scheduleRepository.deleteById(scheduleId);
    }

    /**
     * Removes all schedules for a staff member.
     */
    @Transactional
    public void clearStaffSchedule(Long staffId) {
        scheduleRepository.deleteByStaffId(staffId);
    }

    /**
     * Converts StaffSchedule entity to DTO.
     */
    private StaffScheduleDTO toDTO(StaffSchedule schedule) {
        String dayName = DayOfWeek.of(schedule.getDayOfWeek())
                .getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        
        return StaffScheduleDTO.builder()
                .id(schedule.getId())
                .staffId(schedule.getStaff().getId())
                .staffName(schedule.getStaff().getFullName())
                .shiftTypeId(schedule.getShiftType().getId())
                .shiftName(schedule.getShiftType().getName())
                .startTime(schedule.getShiftType().getStartTime().format(TIME_FORMATTER))
                .endTime(schedule.getShiftType().getEndTime().format(TIME_FORMATTER))
                .dayOfWeek(schedule.getDayOfWeek())
                .dayName(dayName)
                .build();
    }

    /**
     * Converts ShiftType entity to DTO.
     */
    private ShiftTypeDTO toShiftTypeDTO(ShiftType shiftType) {
        return ShiftTypeDTO.builder()
                .id(shiftType.getId())
                .name(shiftType.getName())
                .startTime(shiftType.getStartTime())
                .endTime(shiftType.getEndTime())
                .build();
    }

    /**
     * Converts User entity to UserDTO.
     */
    private UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .build();
    }
}
