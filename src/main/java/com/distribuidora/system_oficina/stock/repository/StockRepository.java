package com.distribuidora.system_oficina.stock.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.stock.entity.Stock;

public interface StockRepository extends JpaRepository<Stock, Integer> {

    Optional<Stock> findByProduct(Product product);
    Optional<Stock> findByProductId(Integer productId);
    List<Stock> findByQuantityLessThan(Integer minQuantity);

}
