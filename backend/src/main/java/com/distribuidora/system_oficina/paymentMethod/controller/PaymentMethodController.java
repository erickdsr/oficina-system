package com.distribuidora.system_oficina.paymentMethod.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.distribuidora.system_oficina.paymentMethod.entity.PaymentMethod;
import com.distribuidora.system_oficina.paymentMethod.dto.PaymentMethodResponseDTO;
import com.distribuidora.system_oficina.paymentMethod.repository.PaymentMethodRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/payment-methods")
@RequiredArgsConstructor
@Tag(name = "Payment Methods", description = "Payment method endpoints")
public class PaymentMethodController {

    private final PaymentMethodRepository paymentMethodRepository;

    @GetMapping
    @Transactional
    @Operation(summary = "List payment methods", description = "Returns all available payment methods")
    public ResponseEntity<List<PaymentMethodResponseDTO>> listPaymentMethods() {
        ensureDefaultPaymentMethods();

        return ResponseEntity.ok(paymentMethodRepository.findAll().stream()
                .map(PaymentMethodResponseDTO::fromEntity)
                .toList());
    }

    private void ensureDefaultPaymentMethods() {
        if (paymentMethodRepository.findByName("PIX").isEmpty()) {
            paymentMethodRepository.save(new PaymentMethod(null, "PIX"));
        }
    }
}
