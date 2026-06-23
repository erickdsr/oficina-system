package com.distribuidora.system_oficina.purchase.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.purchase.entity.Purchase;
import com.distribuidora.system_oficina.purchase.entity.Status;

public interface PurchaseRepository extends JpaRepository <PurchaseRepository, Integer> {
    
    
    List<Purchase> findBySupplierId(Integer supplierId);
    List<Purchase> findByEmployeeId(Integer employeeId);
    List<Purchase> findByStatus(Status status);
}

