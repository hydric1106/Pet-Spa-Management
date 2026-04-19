package com.petspa.repository;

import com.petspa.model.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for SalesOrder entity.
 */
@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    List<SalesOrder> findBySoldAtBetweenOrderBySoldAtDesc(LocalDateTime start, LocalDateTime end);

    long countBySoldAtBetween(LocalDateTime start, LocalDateTime end);

    boolean existsByOrderNo(String orderNo);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM SalesOrder s WHERE s.soldAt >= :start AND s.soldAt < :end")
    BigDecimal sumTotalAmountBySoldAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
