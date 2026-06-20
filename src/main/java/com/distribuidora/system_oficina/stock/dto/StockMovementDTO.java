package com.distribuidora.system_oficina.stock.dto;

import com.distribuidora.system_oficina.stock.entity.StockMovement;
import com.distribuidora.system_oficina.stock.entity.StockMovementType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementDTO {

    @NotNull(message = "O product é obrigatório")
    @Positive
    @Schema(description = "id do product", example = "1")
    private Integer product;
    
    @NotNull(message = "O em,ployee é obrigatório")
    @Positive
    @Schema(description = "id do employee", example = "3")
    private Integer employee;
    
    @NotNull(message = "O tipo é obrigatório")
    @Schema(description = "tipo de movimento", example = "entrada, saida ou ajuste")
    private StockMovementType type;
    
    @Size(max = 255)
    @Schema(description = "motivo", example = "compra finalizada")
    private String reason;

    @Schema(description = "quantidade de movimento", example = "3 vendas")
    private Integer quantity;
     
    public static StockMovementDTO fromEntity(StockMovement stock) {
        return StockMovementDTO.builder()
                .product(stock.getProduct() != null? stock.getProduct().getId() : null)
                .employee(stock.getEmployee() != null? stock.getProduct().getId() : null)
                .type(stock.getType())
                .reason(stock.getReason())
                .quantity(stock.getQuantity())
                .build();
    }
}
