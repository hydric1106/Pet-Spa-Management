package com.petspa.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * Sales order line item DTO used in request/response payloads.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderItemDTO {

    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}
