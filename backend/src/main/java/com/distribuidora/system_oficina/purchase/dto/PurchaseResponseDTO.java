package com.distribuidora.system_oficina.purchase.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

import com.distribuidora.system_oficina.purchase.entity.Purchase;
import com.distribuidora.system_oficina.purchase.entity.Status;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseResponseDTO {
    
    @Schema(description = "id da pruchase")
    private Integer id;

    @Schema(description = "id do supplier")
    private Integer supplierId;

    @Schema(description = "Nome do supplier")
    private String supplierName;

    @Schema(description = "id do employee")
    private Integer employeeId;

    @Schema(description = "nome do employee")
    private String employeeName;

    @Schema(description = "valor total")
    private BigDecimal total;

    @Schema(description = "status da compra")
    private Status status;

    @Schema(description = "Observacao")
    private String notes;

    @Schema(description = "data de criação ")
    private Timestamp createdAt;

    @Schema(description = "data  de atualização")
    private Timestamp updatedAt;

    @Schema(description = "lista dos itens comprados")
    private List<PurchaseItemDTO> items;

    public static PurchaseResponseDTO fromEntity(Purchase purchase) {
        return PurchaseResponseDTO.builder()
            .id(purchase.getId())
            .supplierId(purchase.getSupplier () != null ? purchase.getSupplier().getId() : null)
            .supplierName(purchase.getSupplier() != null ? purchase.getSupplier().getName() : null)
            .employeeId(purchase.getEmployee() != null ? purchase.getEmployee().getId() : null)
            .employeeName(purchase.getEmployee() != null ? purchase.getEmployee().getName() : null)
            .total(purchase.getTotal())
            .status(purchase.getStatus())
            .notes(purchase.getNotes())
            .createdAt(purchase.getCreatedAt())
            .updatedAt(purchase.getUpdatedAt())
            .items(purchase.getItems().stream()
            .map(PurchaseItemDTO::fromEntity)
            .collect(Collectors.toList()))
            .build();
    
    }
}
