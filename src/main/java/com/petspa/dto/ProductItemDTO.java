package com.petspa.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for ProductItem entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductItemDTO {

    private Long id;
    private String name;
    private String category;
    private String sku;
    private BigDecimal price;
    private Integer stockQty;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
