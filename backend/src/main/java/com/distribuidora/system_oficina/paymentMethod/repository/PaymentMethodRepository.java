package com.distribuidora.system_oficina.paymentMethod.repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.distribuidora.system_oficina.paymentMethod.entity.PaymentMethod;

public interface PaymentMethodRepository extends JpaRepository <PaymentMethod, Integer> {
    
    Optional<PaymentMethod> findByName(String name);
    
}
