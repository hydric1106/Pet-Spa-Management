package com.petspa.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for creating a retail sales order.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderCreateRequestDTO {

    private Long soldByUserId;
    private Long customerId;
    private String paymentMethod;
    private BigDecimal discount;
    private String note;
    private List<SalesOrderItemDTO> items;
}
