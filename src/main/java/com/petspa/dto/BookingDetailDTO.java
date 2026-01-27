package com.petspa.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * Data Transfer Object for BookingDetail entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDetailDTO {

    private Long id;
    private Long bookingId;
    private Long serviceId;
    private String serviceName;
    private BigDecimal price;
    private Integer durationMinutes;
}
