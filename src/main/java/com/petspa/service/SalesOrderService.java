package com.petspa.service;

import com.petspa.dto.SalesOrderCreateRequestDTO;
import com.petspa.dto.SalesOrderDTO;
import com.petspa.dto.SalesOrderItemDTO;
import com.petspa.dto.SalesRevenueSummaryDTO;
import com.petspa.model.*;
import com.petspa.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * SalesOrder Service - Handles retail checkout and revenue summary.
 */
@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductItemRepository productItemRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    /**
     * Creates a retail sales order and decrements product stock in one transaction.
     */
    @Transactional
    public SalesOrderDTO createSalesOrder(SalesOrderCreateRequestDTO request) {
        if (request == null) {
            throw new RuntimeException("Sales order payload is required");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("At least one product item is required");
        }

        if (request.getSoldByUserId() == null) {
            throw new RuntimeException("Sold by user ID is required");
        }

        User cashier = userRepository.findById(request.getSoldByUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.getSoldByUserId()));

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found: " + request.getCustomerId()));
        }

        SalesOrder.PaymentMethod paymentMethod = parsePaymentMethod(request.getPaymentMethod());

        SalesOrder order = SalesOrder.builder()
                .orderNo(generateUniqueOrderNo())
                .soldByUser(cashier)
                .customer(customer)
                .paymentMethod(paymentMethod)
                .note(normalizeBlankToNull(request.getNote()))
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (SalesOrderItemDTO itemDTO : request.getItems()) {
            if (itemDTO == null || itemDTO.getProductId() == null) {
                throw new RuntimeException("Each item must include a product ID");
            }

            int qty = itemDTO.getQuantity() == null ? 0 : itemDTO.getQuantity();
            if (qty <= 0) {
                throw new RuntimeException("Quantity must be greater than 0 for product " + itemDTO.getProductId());
            }

            ProductItem product = productItemRepository.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemDTO.getProductId()));

            if (Boolean.FALSE.equals(product.getIsActive())) {
                throw new RuntimeException("Product is inactive: " + product.getName());
            }

            int stockQty = product.getStockQty() == null ? 0 : product.getStockQty();
            if (stockQty < qty) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));

            SalesOrderItem orderItem = SalesOrderItem.builder()
                    .product(product)
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .lineTotal(lineTotal)
                    .build();
            order.addItem(orderItem);

            product.setStockQty(stockQty - qty);
            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal discount = request.getDiscount() == null ? BigDecimal.ZERO : request.getDiscount();
        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Discount cannot be negative");
        }
        if (discount.compareTo(subtotal) > 0) {
            throw new RuntimeException("Discount cannot exceed subtotal");
        }

        BigDecimal total = subtotal.subtract(discount);
        order.setSubtotal(subtotal);
        order.setDiscount(discount);
        order.setTotalAmount(total);

        SalesOrder saved = salesOrderRepository.save(order);
        return toDTO(saved);
    }

    /**
     * Gets sales orders for a specific date.
     */
    @Transactional(readOnly = true)
    public List<SalesOrderDTO> getSalesByDate(String dateStr) {
        LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        return salesOrderRepository.findBySoldAtBetweenOrderBySoldAtDesc(start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets retail, service, and combined revenue summary for today.
     */
    @Transactional(readOnly = true)
    public SalesRevenueSummaryDTO getTodayRevenueSummary() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        BigDecimal retailRevenue = safeMoney(salesOrderRepository.sumTotalAmountBySoldAtBetween(start, end));
        BigDecimal serviceRevenue = safeMoney(
                bookingRepository.sumRevenueByDateExcludingStatus(today, Booking.BookingStatus.CANCELLED)
        );
        BigDecimal combinedRevenue = retailRevenue.add(serviceRevenue);
        long totalSalesOrders = salesOrderRepository.countBySoldAtBetween(start, end);

        return SalesRevenueSummaryDTO.builder()
                .date(today.format(DATE_FORMATTER))
                .retailRevenue(retailRevenue)
                .serviceRevenue(serviceRevenue)
                .combinedRevenue(combinedRevenue)
                .totalSalesOrders(totalSalesOrders)
                .build();
    }

    private SalesOrderDTO toDTO(SalesOrder order) {
        List<SalesOrderItemDTO> items = order.getItems().stream()
                .map(item -> SalesOrderItemDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .lineTotal(item.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        return SalesOrderDTO.builder()
                .id(order.getId())
                .orderNo(order.getOrderNo())
                .soldAt(order.getSoldAt())
                .soldByUserId(order.getSoldByUser() != null ? order.getSoldByUser().getId() : null)
                .soldByName(order.getSoldByUser() != null ? order.getSoldByUser().getFullName() : null)
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : null)
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .subtotal(order.getSubtotal())
                .discount(order.getDiscount())
                .totalAmount(order.getTotalAmount())
                .note(order.getNote())
                .items(items)
                .build();
    }

    private SalesOrder.PaymentMethod parsePaymentMethod(String rawPaymentMethod) {
        if (rawPaymentMethod == null || rawPaymentMethod.isBlank()) {
            return SalesOrder.PaymentMethod.CASH;
        }

        try {
            return SalesOrder.PaymentMethod.valueOf(rawPaymentMethod.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Unsupported payment method: " + rawPaymentMethod);
        }
    }

    private String normalizeBlankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String generateUniqueOrderNo() {
        for (int attempt = 0; attempt < 5; attempt++) {
            LocalDateTime now = LocalDateTime.now();
            int random = ThreadLocalRandom.current().nextInt(100, 1000);
            String orderNo = String.format("INV-%s-%03d", now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")), random);
            if (!salesOrderRepository.existsByOrderNo(orderNo)) {
                return orderNo;
            }
        }

        throw new RuntimeException("Unable to generate unique order number. Please try again.");
    }
}
