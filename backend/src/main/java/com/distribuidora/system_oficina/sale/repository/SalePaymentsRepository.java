package com.distribuidora.system_oficina.sale.repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.distribuidora.system_oficina.sale.entity.SalePayments;

public interface SalePaymentsRepository extends JpaRepository <SalePayments, Integer> {
    

    List <SalePayments> findBySaleId(Integer saleId);
    List <SalePayments> findByPaymentMethodId_Id(Integer Id);
    List <SalePayments> findByAmount(BigDecimal amount);
    long countBySaleIdIn(Collection<Integer> saleIds);

    @Modifying
    @Query("delete from SalePayments payment where payment.sale.id in :saleIds")
    void deleteAllBySaleIdIn(@Param("saleIds") Collection<Integer> saleIds);
}
