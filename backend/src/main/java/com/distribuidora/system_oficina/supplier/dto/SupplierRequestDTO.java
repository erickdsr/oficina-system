package com.distribuidora.system_oficina.supplier.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SupplierRequestDTO {

    @NotBlank
    @Size(max = 150)
    @Schema(description = "Nome principal exibido do fornecedor", example = "Bosch Brasil")
    private String name;

    @NotBlank
    @Size(max = 180)
    @Schema(description = "Razao social do fornecedor", example = "Robert Bosch Ltda.")
    private String legalName;

    @NotBlank
    @Size(max = 150)
    @Schema(description = "Nome fantasia do fornecedor", example = "Bosch Brasil")
    private String tradeName;

    @NotBlank
    @Size(max = 18)
    @Pattern(regexp = "^(?:\\D*\\d){14}\\D*$", message = "CNPJ deve conter 14 digitos")
    @Schema(description = "CNPJ do fornecedor", example = "46.000.000/0001-00")
    private String cnpj;

    @Size(max = 30)
    @Schema(description = "Inscricao estadual", example = "244.987.321.118")
    private String stateRegistration;

    @NotBlank
    @Size(max = 120)
    @Schema(description = "Responsavel comercial", example = "Carlos Mendes")
    private String contactName;

    @NotBlank
    @Email
    @Size(max = 254)
    @Schema(description = "Email do fornecedor", example = "compras@bosch-autopecas.com.br")
    private String email;

    @NotBlank
    @Size(max = 20)
    @Pattern(regexp = "^(?:\\D*\\d){10,11}\\D*$", message = "Telefone deve conter DDD e 10 ou 11 digitos")
    @Schema(description = "Telefone do fornecedor", example = "(11) 4000-1000")
    private String phone;

    @Size(max = 255)
    @Schema(description = "Endereco completo legado", example = "Avenida Brasil, 1000, Centro")
    private String address;

    @NotBlank
    @Size(max = 9)
    @Pattern(regexp = "^(?:\\D*\\d){8}\\D*$", message = "CEP deve conter 8 digitos")
    @Schema(description = "CEP", example = "13010-000")
    private String zipCode;

    @NotBlank
    @Size(max = 150)
    @Schema(description = "Rua", example = "Avenida Brasil")
    private String street;

    @NotBlank
    @Size(max = 20)
    @Schema(description = "Numero", example = "1000")
    private String number;

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Bairro", example = "Centro")
    private String district;

    @Size(max = 120)
    @Schema(description = "Complemento", example = "Bloco B")
    private String complement;

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Cidade do fornecedor", example = "Campinas")
    private String city;

    @NotBlank
    @Size(min = 2, max = 2)
    @Pattern(
            regexp = "^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$",
            message = "Estado deve conter uma UF valida")
    @Schema(description = "Estado do fornecedor", example = "SP")
    private String state;

    @NotNull
    @Schema(description = "Status do fornecedor", example = "true")
    private Boolean status;
}
