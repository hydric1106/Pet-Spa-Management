package com.petspa.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Data Transfer Object for Booking entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDTO {

    private Long id;
    
    // Customer info
    private Long customerId;
    private String customerName;
    private String customerPhone;
    
    // Pet info
    private Long petId;
    private String petName;
    private String petSpecies;
    
    // Staff info
    private Long staffId;
    private String staffName;
    
    // Booking details
    private LocalDate bookingDate;
    private LocalTime bookingTime;
    private String status;
    private String cancelReason;
    private BigDecimal totalPrice;
    private LocalDateTime createdAt;
    
    // Services included
    private List<BookingDetailDTO> services;
}
