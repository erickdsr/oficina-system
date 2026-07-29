package com.distribuidora.system_oficina.product.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.product.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    List<Product> findByName(String name);
    Optional<Product> findByInternalCode(String internalCode);
    Optional<Product> findByBarCode(String barCode);
    Optional<Product> findByPartNumber(String partNumber);
    Optional<Product> findByPartNumberIgnoreCase(String partNumber);
    Optional<Product> findByStatus(Boolean status);
    List<Product> findAllByStatus(Boolean status);
    long countByCategoryId(Integer categoryId);
    long countBySupplierId(Integer supplierId);
    List<Product> findAllByCategoryId(Integer categoryId);
    List<Product> findAllBySupplierId(Integer supplierId);
}
