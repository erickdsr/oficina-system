package com.distribuidora.system_oficina.sale.dto;

import java.math.BigDecimal;

import com.distribuidora.system_oficina.sale.entity.SalePayments;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalePaymentDTO {
    
    @NotNull
    @Schema(description = "metodo de payment", example = "1")
    private Integer paymentMethodId;
    
    @NotNull
    @Schema(description = "valor pago com esse metodo", example = "19.90")
    private BigDecimal amount;

    public static SalePaymentDTO fromEntity(SalePayments salePayments) {
        return SalePaymentDTO.builder()

        .paymentMethodId(salePayments.getPaymentMethodId().getId())
        .amount(salePayments.getAmount())
        .build();
        
    }
}
