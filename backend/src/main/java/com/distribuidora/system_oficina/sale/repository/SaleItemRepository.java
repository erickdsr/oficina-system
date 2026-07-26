package com.distribuidora.system_oficina.sale.repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.distribuidora.system_oficina.sale.entity.SaleItem;

public interface SaleItemRepository extends JpaRepository <SaleItem, Integer> {

    List<SaleItem> findBySaleId(Integer saleId);
    List<SaleItem> findByProductId(Integer productId);
    List<SaleItem> findBySubtotal(BigDecimal subtotal);
    long countBySaleIdIn(Collection<Integer> saleIds);
    long countByProductIdIn(Collection<Integer> productIds);

    @Modifying
    @Query("delete from SaleItem item where item.sale.id in :saleIds")
    void deleteAllBySaleIdIn(@Param("saleIds") Collection<Integer> saleIds);

    @Query("select distinct item.sale.id from SaleItem item where item.product.id in :productIds")
    Set<Integer> findSaleIdsByProductIdIn(@Param("productIds") Collection<Integer> productIds);

    @Modifying
    @Query("delete from SaleItem item where item.product.id in :productIds")
    void deleteAllByProductIdIn(@Param("productIds") Collection<Integer> productIds);
    
}
