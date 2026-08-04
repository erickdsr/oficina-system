package com.distribuidora.system_oficina.purchase.dto;

import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
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
public class PurchaseRequestDTO {
    
    @NotNull
    @Positive
    @Schema(description = "id do supplier", example = "1")
    private Integer supplierId;

    @NotNull
    @Positive
    @Schema(description = "qual emplyee est registrando", example = "4")
    private Integer employeeId;

    @Size(max = 255)
    @Schema(description = "Observacao", example = "teste")
    private String notes;

    @Valid
    @NotEmpty
    @Schema(description = "lista dos itens comprados", example = "pneus, aros e oleos")
    private List<PurchaseItemDTO> items;
}
