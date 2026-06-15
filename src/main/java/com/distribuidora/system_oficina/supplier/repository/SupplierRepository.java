package com.distribuidora.system_oficina.supplier.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.supplier.entity.Supplier;    

public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    
    public Supplier findByCnpj(String cnpj);
    public Supplier findByName(String name);
    public Supplier findbyStatus(Boolean status);
}
