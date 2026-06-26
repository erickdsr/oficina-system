package com.distribuidora.system_oficina.sale.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.sale.entity.SalePayments;

public interface SalePaymentsRepository extends JpaRepository <SalePayments, Integer> {
    

    List <SalePayments> findBySaleId(Integer saleId);
    List <SalePayments> findByPaymentMethodId_Id(Integer Id);
    List <SalePayments> findByAmount(BigDecimal amount);
}
