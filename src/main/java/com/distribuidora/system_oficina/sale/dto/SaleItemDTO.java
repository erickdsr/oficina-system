package com.distribuidora.system_oficina.sale.dto;

import java.math.BigDecimal;

import com.distribuidora.system_oficina.sale.entity.SaleItem;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleItemDTO {
    
    @NotNull
    @Positive
    @Schema(description = "id do produto", example = "5")
    private Integer productId;
    
    @NotNull
    @Positive
    @Schema(description = "quantidade de unidades", example = "7")
    private Integer quantity;
    
    @NotNull
    @Positive
    @Schema(description = "preco de vendas", example = "25.50")
    private BigDecimal unitPrice;

    @Builder.Default
    @Schema(description = "desconto", example = "10.00")
    private BigDecimal discount = BigDecimal.ZERO; 

    @NotNull
    @Schema(description = "subtotal", example = "234.00")
    private BigDecimal subtotal; 

    public static SaleItemDTO fromEntity(SaleItem saleItem) {
        return SaleItemDTO.builder()

        .productId(saleItem.getProduct() != null ? saleItem.getId() : null)
        .quantity(saleItem.getQuantity())
        .unitPrice(saleItem.getUnitPrice())
        .discount(saleItem.getDiscount())
        .subtotal(saleItem.getSubtotal())
        .build();
        
    }
}
