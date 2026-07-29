package com.distribuidora.system_oficina.client.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class ClientRequestDTO {

    @NotBlank
    @Size(max = 150)
    @Schema(description = "Client full name", example = "John Smith")
    private String name;
    
    @NotBlank
    @Size(max = 20)
    @Pattern(regexp = "^(\\d{11}|\\d{14})$", message = "CPF/CNPJ deve conter 11 ou 14 digitos")
    @Schema(description = "Client CPF or CNPJ", example = "123.456.789-00")
    private String cpfCnpj;
    
    @Size(max = 254)
    @Schema(description = "Client email address", example = "john.smith@email.com")
    private String email;

    @NotBlank
    @Size(max = 254)
    @Schema(description = "Client type", example = "INDIVIDUAL")
    private String clientType;
    
    @NotBlank
    @Size(max = 20)
    @Schema(description = "Client phone number", example = "(11) 98765-4321")
    private String phone;

    @Size(max = 20)
    @Schema(description = "Client secondary phone number", example = "(11) 98888-7777")
    private String secondaryPhone;

    @Size(max = 255)
    @Schema(description = "Client address", example = "Main Street, 123")
    private String address;

    @Size(max = 8)
    @Pattern(regexp = "^(\\d{8})?$", message = "CEP deve conter 8 digitos")
    @Schema(description = "Client ZIP code", example = "01001000")
    private String zipCode;

    @Size(max = 150)
    @Schema(description = "Client street", example = "Rua das Flores")
    private String street;

    @Size(max = 20)
    @Schema(description = "Client address number", example = "123")
    private String number;

    @Size(max = 120)
    @Schema(description = "Client address complement", example = "Sala 4")
    private String complement;

    @Size(max = 100)
    @Schema(description = "Client district", example = "Centro")
    private String district;

    @Size(max = 100)
    @Schema(description = "Client city", example = "São Paulo")
    private String city;

    @Size(max = 100)
    @Pattern(
            regexp = "^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)?$",
            message = "State must be a valid Brazilian UF")
    @Schema(description = "Client state", example = "SP")
    private String state;

    @NotNull
    @Schema(description = "Client active status", example = "true")
    private Boolean status;

    @Size(max = 1000)
    @Schema(description = "Client notes", example = "Prefere contato por telefone no periodo da manha")
    private String notes;
}
