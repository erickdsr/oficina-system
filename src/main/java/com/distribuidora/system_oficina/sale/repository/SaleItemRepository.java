package com.distribuidora.system_oficina.sale.repository;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.sale.entity.SaleItem;

public interface SaleItemRepository extends JpaRepository <SaleItem, Integer> {

    List<SaleItem> findBySaleId(Integer saleId);
    List<SaleItem> findByProductId(Integer productId);
    List<SaleItem> findBySubtotal(BigDecimal subtotal);
    
}
