package com.distribuidora.system_oficina.stock.repository;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.stock.entity.StockMovement;
import com.distribuidora.system_oficina.stock.entity.StockMovementType;

public interface StockMovementRepository extends JpaRepository<StockMovement, Integer> {
    
    List<StockMovement> findByProduct(Product product);
    List<StockMovement> findByProductId(Integer productId);
    List<StockMovement> findByEmployeeId(Integer employeeId);
    List<StockMovement> findByType(StockMovementType type);
    long countByProductId(Integer productId);
    long countByProductIdIn(Collection<Integer> productIds);
    long countByEmployeeId(Integer employeeId);
    long countByReasonContaining(String reason);

    @Modifying
    @Query("delete from StockMovement movement where movement.product.id in :productIds")
    void deleteAllByProductIdIn(@Param("productIds") Collection<Integer> productIds);

    @Modifying
    @Query("delete from StockMovement movement where movement.employee.id = :employeeId")
    void deleteAllByEmployeeId(@Param("employeeId") Integer employeeId);
}
