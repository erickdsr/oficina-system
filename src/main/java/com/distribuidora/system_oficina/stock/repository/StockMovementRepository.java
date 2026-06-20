package com.distribuidora.system_oficina.stock.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.stock.entity.StockMovement;
public interface StockMovementRepository extends JpaRepository<StockMovement, Integer> {
    
    List<StockMovement> findByProduct(Product product);
    List<StockMovement> findByProductId(Integer productId);
    List<StockMovement> findByEmployeeId(Integer employeeId);
    List<StockMovement> findByType(String type);
}
