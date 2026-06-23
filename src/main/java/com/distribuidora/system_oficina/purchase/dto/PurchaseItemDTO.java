package com.distribuidora.system_oficina.purchase.dto;

import java.math.BigDecimal;

import com.distribuidora.system_oficina.purchase.entity.PurchaseItem;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseItemDTO {
   
    @NotNull(message = "O product é obrigatório")
    @Positive
    @Schema(description = "id do product", example = "1")
    private Integer productId;

    @NotNull(message = "A quantidade é obrigatória")
    @Positive
    @Schema(description = "quantidade do product", example = "5")
    private Integer quantity;
    
    @NotNull(message = "O preco da unidade é obrigatório")
    @Positive
    @Schema(description = "custo da unidade", example = "12.50")
    private BigDecimal unitCost;

    @Schema(description = "subtotal dos produtos", example = "250.25")
    private BigDecimal subtotal;

     public static PurchaseItemDTO fromEntity(PurchaseItem purchaseItem) {
        return PurchaseItemDTO.builder()
                .productId(purchaseItem.getProduct() != null? purchaseItem.getProduct().getId() : null)
                .quantity(purchaseItem.getQuantity())
                .unitCost(purchaseItem.getUnitCost())
                .subtotal(purchaseItem.getSubtotal())
                .build();
    }
}
