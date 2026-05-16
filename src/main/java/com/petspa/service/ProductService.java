package com.petspa.service;

import com.petspa.dto.ProductItemDTO;
import com.petspa.model.ProductItem;
import com.petspa.repository.ProductItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Product Service - Manages retail product items.
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductItemRepository productItemRepository;

    /**
     * Gets all products.
     */
    @Transactional(readOnly = true)
    public List<ProductItemDTO> getAllProducts() {
        return productItemRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets all active products.
     */
    @Transactional(readOnly = true)
    public List<ProductItemDTO> getAllActiveProducts() {
        return productItemRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Creates a new product.
     */
    @Transactional
    public ProductItemDTO createProduct(ProductItemDTO dto) {
        validateProductPayload(dto, true);

        ProductItem item = ProductItem.builder()
                .name(dto.getName().trim())
                .category(normalizeBlankToNull(dto.getCategory()))
                .sku(normalizeBlankToNull(dto.getSku()))
                .price(dto.getPrice())
                .stockQty(dto.getStockQty() == null ? 0 : dto.getStockQty())
                .isActive(dto.getIsActive() == null ? true : dto.getIsActive())
                .build();

        ProductItem saved = productItemRepository.save(item);
        return toDTO(saved);
    }

    /**
     * Updates an existing product.
     */
    @Transactional
    public ProductItemDTO updateProduct(ProductItemDTO dto) {
        if (dto.getId() == null) {
            throw new RuntimeException("Product ID is required");
        }

        validateProductPayload(dto, false);

        ProductItem item = productItemRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + dto.getId()));

        item.setName(dto.getName().trim());
        item.setCategory(normalizeBlankToNull(dto.getCategory()));
        item.setSku(normalizeBlankToNull(dto.getSku()));
        item.setPrice(dto.getPrice());
        item.setStockQty(dto.getStockQty() == null ? 0 : dto.getStockQty());

        if (dto.getIsActive() != null) {
            item.setIsActive(dto.getIsActive());
        }

        ProductItem saved = productItemRepository.save(item);
        return toDTO(saved);
    }

    /**
     * Deactivates a product (soft delete).
     */
    @Transactional
    public void deactivateProduct(Long productId) {
        ProductItem item = productItemRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        item.setIsActive(false);
        productItemRepository.save(item);
    }

    /**
     * Deletes a product (hard delete).
     */
    @Transactional
    public void deleteProduct(Long productId) {
        ProductItem item = productItemRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        productItemRepository.delete(item);
    }

    /**
     * Gets a product by ID.
     */
    @Transactional(readOnly = true)
    public ProductItem getProductEntityById(Long productId) {
        return productItemRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
    }

    /**
     * Validates stock availability for checkout quantity.
     */
    @Transactional(readOnly = true)
    public void validateStock(Long productId, Integer requestedQty) {
        if (requestedQty == null || requestedQty <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        ProductItem item = getProductEntityById(productId);
        if (Boolean.FALSE.equals(item.getIsActive())) {
            throw new RuntimeException("Product is inactive: " + item.getName());
        }

        if (item.getStockQty() == null || item.getStockQty() < requestedQty) {
            throw new RuntimeException("Insufficient stock for product: " + item.getName());
        }
    }

    private void validateProductPayload(ProductItemDTO dto, boolean creating) {
        if (dto == null) {
            throw new RuntimeException("Product payload is required");
        }

        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new RuntimeException("Product name is required");
        }

        if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Product price must be greater than 0");
        }

        if (dto.getStockQty() != null && dto.getStockQty() < 0) {
            throw new RuntimeException("Stock quantity cannot be negative");
        }

        String normalizedSku = normalizeBlankToNull(dto.getSku());
        if (normalizedSku != null) {
            if (creating) {
                if (productItemRepository.existsBySku(normalizedSku)) {
                    throw new RuntimeException("SKU already exists: " + normalizedSku);
                }
            } else if (dto.getId() != null && productItemRepository.existsBySkuAndIdNot(normalizedSku, dto.getId())) {
                throw new RuntimeException("SKU already exists: " + normalizedSku);
            }
        }
    }

    private String normalizeBlankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ProductItemDTO toDTO(ProductItem item) {
        return ProductItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .category(item.getCategory())
                .sku(item.getSku())
                .price(item.getPrice())
                .stockQty(item.getStockQty())
                .isActive(item.getIsActive())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
