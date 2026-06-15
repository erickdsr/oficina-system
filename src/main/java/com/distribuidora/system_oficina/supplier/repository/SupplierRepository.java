package com.distribuidora.system_oficina.supplier.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.supplier.entity.Supplier;    

public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    
    Optional<Supplier> findByCnpj(String cnpj);
    List<Supplier> findByName(String name);
    List<Supplier> findByStatus(Boolean status);
}
