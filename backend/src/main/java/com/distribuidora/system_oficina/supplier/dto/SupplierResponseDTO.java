package com.distribuidora.system_oficina.supplier.dto;

import java.sql.Timestamp;

import com.distribuidora.system_oficina.supplier.entity.Supplier;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SupplierResponseDTO {

    @Schema(description = "ID do fornecedor")
    private Integer id;

    @Schema(description = "Nome principal exibido do fornecedor")
    private String name;

    @Schema(description = "Razao social do fornecedor")
    private String legalName;

    @Schema(description = "Nome fantasia do fornecedor")
    private String tradeName;

    @Schema(description = "CNPJ do fornecedor")
    private String cnpj;

    @Schema(description = "Inscricao estadual")
    private String stateRegistration;

    @Schema(description = "Responsavel comercial")
    private String contactName;

    @Schema(description = "Email do fornecedor")
    private String email;

    @Schema(description = "Telefone do fornecedor")
    private String phone;

    @Schema(description = "Endereco completo legado")
    private String address;

    @Schema(description = "CEP")
    private String zipCode;

    @Schema(description = "Rua")
    private String street;

    @Schema(description = "Numero")
    private String number;

    @Schema(description = "Bairro")
    private String district;

    @Schema(description = "Complemento")
    private String complement;

    @Schema(description = "Cidade do fornecedor")
    private String city;

    @Schema(description = "Estado do fornecedor")
    private String state;

    @Schema(description = "Status do fornecedor")
    private Boolean status;

    @Schema(description = "Data de criacao do fornecedor")
    private Timestamp createdAt;

    @Schema(description = "Data de atualizacao do fornecedor")
    private Timestamp updatedAt;

    public static SupplierResponseDTO fromEntity(Supplier supplier) {
        return SupplierResponseDTO.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .legalName(supplier.getLegalName())
                .tradeName(supplier.getTradeName())
                .cnpj(supplier.getCnpj())
                .stateRegistration(supplier.getStateRegistration())
                .contactName(supplier.getContactName())
                .email(supplier.getEmail())
                .phone(supplier.getPhone())
                .address(supplier.getAddress())
                .zipCode(supplier.getZipCode())
                .street(supplier.getStreet())
                .number(supplier.getNumber())
                .district(supplier.getDistrict())
                .complement(supplier.getComplement())
                .city(supplier.getCity())
                .state(supplier.getState())
                .status(supplier.getStatus())
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }
}
