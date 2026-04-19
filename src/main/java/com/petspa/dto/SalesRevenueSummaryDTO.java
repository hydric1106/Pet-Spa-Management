package com.petspa.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO for daily retail/service/combined revenue summary.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesRevenueSummaryDTO {

    private String date;
    private BigDecimal retailRevenue;
    private BigDecimal serviceRevenue;
    private BigDecimal combinedRevenue;
    private Long totalSalesOrders;
}
