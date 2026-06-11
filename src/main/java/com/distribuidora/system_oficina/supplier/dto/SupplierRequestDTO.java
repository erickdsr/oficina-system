package com.distribuidora.system_oficina.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SupplierRequestDTO {
    
    @NotBlank
    @Size(max = 150)
    @Schema(description = "Nome do fornecedor", example = "Fornecedor XYZ")
    private String name;
    
    @NotBlank
    @Size(max = 14)
    @Schema(description = "CNPJ do fornecedor", example = "12.345.678/0001-90")
    private String cnpj;

    @Size(max = 254)
    @Schema(description = "Email do fornecedor", example = "contato@fornecedorxyz.com")
    private String email;

    @Size(max = 20)
    @Schema(description = "Telefone do fornecedor", example = "(11) 98765-4321")
    private String phone;

    @Size(max = 255)
    @Schema(description = "Endereço do fornecedor", example = "Rua das Flores, 123, Bairro Jardim")
    private String address;

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Cidade do fornecedor", example = "São Paulo")
    private String city;

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Estado do fornecedor", example = "SP")
    private String state;

    @NotNull
    @Schema(description = "Status do fornecedor", example = "true")
    private Boolean status;
}
