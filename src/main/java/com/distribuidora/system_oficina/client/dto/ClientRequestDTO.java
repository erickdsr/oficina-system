package com.distribuidora.system_oficina.client.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    @Schema(description = "Client CPF or CNPJ", example = "123.456.789-00")
    private String cpfcnpj;
    
    @NotBlank
    @Size(max = 254)
    @Schema(description = "Client email address", example = "john.smith@email.com")
    private String email;

    @NotBlank
    @Size(max = 254)
    @Schema(description = "Client type", example = "INDIVIDUAL")
    private String clientype;
    
    @NotBlank
    @Size(max = 20)
    @Schema(description = "Client phone number", example = "(11) 98765-4321")
    private String phone;

    @Size(max = 255)
    @Schema(description = "Client address", example = "Main Street, 123")
    private String address;

    @Size(max = 100)
    @Schema(description = "Client city", example = "São Paulo")
    private String city;

    @Size(max = 100)
    @Schema(description = "Client state", example = "SP")
    private String state;

    @NotNull
    @Schema(description = "Client active status", example = "true")
    private Boolean status;
}
