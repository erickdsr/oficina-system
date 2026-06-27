package com.distribuidora.system_oficina.product.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.product.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    List<Product> findByName(String name);
    Optional<Product> findByBarCode(String barCode);
    Optional<Product> findByPartNumber(String partNumber);
    Optional<Product> findByStatus(Boolean status);
}
