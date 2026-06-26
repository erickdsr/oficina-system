package com.distribuidora.system_oficina.sale.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

import com.distribuidora.system_oficina.purchase.entity.Status;
import com.distribuidora.system_oficina.sale.entity.Sale;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleResponseDTO {
    
    @Schema(description = "id de sale")
    private Integer id;

    @Schema(description = "id do client")
    private Integer clientId;

    @Schema(description = "nome do client")
    private String clientName;

    @Schema(description = "id do employee")
    private Integer employeeId;

    @Schema(description = "nome do employee")
    private String employeeName;

    @Schema(description = "total")
    private BigDecimal total;

    @Schema(description = "desconut")
    private BigDecimal discount;

    @Schema(description = "status de sale")
    private Status status;

    @Schema(description = "notes")
    private String notes;

    @Schema(description = "data de criacao de sale")
    private Timestamp createdAt;

    @Schema(description = "data de atualizacao de sale")
    private Timestamp updatedAt;

    @Schema(description = "itens")
    private List<SaleItemDTO> items;

    @Schema(description = "payments")       
    private List<SalePaymentDTO> payments;
    
    public static SaleResponseDTO fromEntity(Sale sale){
        return SaleResponseDTO.builder()

        .id(sale.getId())
        .clientId(sale.getClient() != null ? sale.getClient().getId() : null)
        .clientName(sale.getClient() != null ? sale.getClient().getName() : null)
        .employeeId(sale.getEmployee() != null ? sale.getEmployee().getId() : null)
        .employeeName(sale.getEmployee() != null ? sale.getEmployee().getName() : null)
        .total(sale.getTotal())
        .discount(sale.getDiscount())
        .status(sale.getStatus())
        .notes(sale.getNotes())
        .createdAt(sale.getCreatedAt())
        .updatedAt(sale.getUpdatedAt())
        .items(sale.getItems().stream()
        .map(SaleItemDTO::fromEntity)
        .collect(Collectors.toList()))
        .payments(sale.getPayments().stream()
        .map(SalePaymentDTO::fromEntity)
        .collect(Collectors.toList()))
        .build();
    }
}
