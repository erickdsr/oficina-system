package com.distribuidora.system_oficina.stock.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.stock.entity.Stock;

public interface StockRepository extends JpaRepository<Stock, Integer> {

    Optional<Stock> findByProduct(Product product);
    Optional<Stock> findByProductId(Integer productId);
    List<Stock> findByQuantityLessThan(Integer minQuantity);
    long countByProductId(Integer productId);
    long countByProductIdIn(Collection<Integer> productIds);

    @Modifying
    @Query("delete from Stock stock where stock.product.id in :productIds")
    void deleteAllByProductIdIn(@Param("productIds") Collection<Integer> productIds);
}
