package com.distribuidora.system_oficina.purchase.dto;

import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequestDTO {
    
    @Schema(description = "id do supplier", example = "1")
    private Integer supplierId;

    @Schema(description = "qual emplyee est registrando", example = "4")
    private Integer employeeId;

    @Schema(description = "Observacao", example = "teste")
    private String notes;

    @Schema(description = "lista dos itens comprados", example = "pneus, aros e oleos")
    private List<PurchaseItemDTO> items;
}
