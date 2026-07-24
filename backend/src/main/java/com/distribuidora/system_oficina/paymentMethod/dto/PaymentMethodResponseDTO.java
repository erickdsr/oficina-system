package com.distribuidora.system_oficina.paymentMethod.dto;

import com.distribuidora.system_oficina.paymentMethod.entity.PaymentMethod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodResponseDTO {

    private Integer id;

    private String name;

    public static PaymentMethodResponseDTO fromEntity(PaymentMethod paymentMethod) {
        return PaymentMethodResponseDTO.builder()
                .id(paymentMethod.getId())
                .name(paymentMethod.getName())
                .build();
    }
}
