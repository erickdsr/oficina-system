package com.distribuidora.system_oficina.supplier.dto;

import java.sql.Timestamp;

import com.distribuidora.system_oficina.supplier.entity.Supplier;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor    
public class SupplierResponseDTO {

    @Schema(description = "ID do fornecedor")
    private Integer id;

    @Schema(description = "Nome do fornecedor")
    private String name;

    @Schema(description = "CNPJ do fornecedor")
    private String cnpj;

    @Schema(description = "Email do fornecedor")
    private String email;

    @Schema(description = "Telefone do fornecedor")
    private String phone;

    @Schema(description = "Endereço do fornecedor")
    private String address;

    @Schema(description = "Cidade do fornecedor")
    private String city;

    @Schema(description = "Estado do fornecedor")
    private String state;

    @Schema(description = "Status do fornecedor")
    private Boolean status;

    @Schema(description = "Data de criação do fornecedor")
    private Timestamp createdAt;

    @Schema(description = "Data de atualização do fornecedor")
    private Timestamp updatedAt;

    public static SupplierResponseDTO fromEntity(Supplier supplier) {
        return SupplierResponseDTO.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .cnpj(supplier.getCnpj())
                .email(supplier.getEmail())
                .phone(supplier.getPhone())
                .address(supplier.getAddress())
                .city(supplier.getCity())
                .state(supplier.getState())
                .status(supplier.getStatus())
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }
}
