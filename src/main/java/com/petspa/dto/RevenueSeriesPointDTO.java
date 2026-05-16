package com.petspa.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO for revenue chart series points.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueSeriesPointDTO {

    private String label;
    private String startDate;
    private String endDate;
    private BigDecimal retailRevenue;
    private BigDecimal serviceRevenue;
    private BigDecimal combinedRevenue;
}
