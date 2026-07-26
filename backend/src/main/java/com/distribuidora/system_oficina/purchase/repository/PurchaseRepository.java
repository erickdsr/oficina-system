package com.distribuidora.system_oficina.purchase.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.distribuidora.system_oficina.purchase.entity.Purchase;
import com.distribuidora.system_oficina.purchase.entity.Status;

public interface PurchaseRepository extends JpaRepository <Purchase, Integer> {
    
    
    List<Purchase> findBySupplierId(Integer supplierId);
    List<Purchase> findByEmployeeId(Integer employeeId);
    List<Purchase> findByStatus(Status status);
    List<Purchase> findByActive(Boolean active);
    @Query("select purchase from Purchase purchase where purchase.active = true or purchase.active is null")
    List<Purchase> findActivePurchases();
    long countBySupplierId(Integer supplierId);
    long countByEmployeeId(Integer employeeId);
}

