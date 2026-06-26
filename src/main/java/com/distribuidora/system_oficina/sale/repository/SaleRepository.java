package com.distribuidora.system_oficina.sale.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.distribuidora.system_oficina.purchase.entity.Status;
import com.distribuidora.system_oficina.sale.entity.Sale;

public interface SaleRepository extends JpaRepository <Sale, Integer> {

    List <Sale> findByClientId(Integer clientId);
    List <Sale> findByEmployeeId(Integer employeeId);
    List <Sale> findByStatus(Status status);
    
}
