package com.petspa.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for SalesOrder entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderDTO {

    private Long id;
    private String orderNo;
    private LocalDateTime soldAt;

    private Long soldByUserId;
    private String soldByName;

    private Long customerId;
    private String customerName;

    private String paymentMethod;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private String note;

    private List<SalesOrderItemDTO> items;
}
