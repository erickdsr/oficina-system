package com.distribuidora.system_oficina.stock.dto;

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
public class StockRequestDTO {
    
    @NotNull(message = "O produto é obrigatório")
    @Positive
    @Schema(description = "id do product", example = "1")
    private Integer productId;
    
    @NotNull
    @Schema(description = "quantitade do product", example = "14")
    private Integer quantity;
    
    @NotNull
    @Builder.Default
    @Schema(description = "quantidade minima do product", example = "5")
    private Integer minQuantity = 5;

    @Size(max = 50)
    private String location;
}
