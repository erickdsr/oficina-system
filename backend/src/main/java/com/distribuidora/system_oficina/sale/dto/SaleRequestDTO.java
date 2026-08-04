package com.distribuidora.system_oficina.sale.dto;

import java.math.BigDecimal;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleRequestDTO {
    
    @NotNull
    @Positive
    @Schema(description = "Id do client", example = "3")
    private Integer clientId;

    @NotNull
    @Positive
    @Schema(description = "id do emplyee", example = "4")
    private Integer employeeId;
    
    @Builder.Default
    @PositiveOrZero
    @Schema(description = "desconto geral", example = "20.50")
    private BigDecimal discount = BigDecimal.ZERO;
    
    @Size(max = 255)
    @Schema(description = "Obsecation", example = "teste")
    private String notes;

    @Valid
    @NotEmpty
    @Schema(description = "lista de itens", example = "[{ \\\"productId\\\": 1, \\\"quantity\\\": 1 }]")
    private List<SaleItemDTO> items;

    @Valid
    @NotEmpty
    @Schema(description = "Lista de payment", example = "teste")
    private List<SalePaymentDTO> payments;
}
