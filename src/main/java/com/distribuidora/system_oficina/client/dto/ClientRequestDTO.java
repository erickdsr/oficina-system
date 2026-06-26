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
    @Schema(description = "Nome do cliente", example = "Cliente João")
    private String name;
    
    @NotBlank
    @Size(max = 20)
    @Schema(description = "CPF ou CNPJ do cliente", example = "123.456.789.00, 12.345.678/0001-90")
    private String cpfcnpj;
    
    @NotBlank
    @Size(max = 254)
    @Schema(description = "Email do cliente", example = "contato@clientexyz.com")
    private String email;

    @NotBlank
    @Size(max = 254)
    @Schema(description = "Tipo de cliente", example = "FISICA, JURIDICA")
    private String clientype;
    
    @NotBlank
    @Size(max = 20)
    @Schema(description = "Telefone do cliente", example = "(11) 98765-4321")
    private String phone;

    @Size(max = 255)
    @Schema(description = "Endereço do cliente", example = "Rua das Flores, 123, Bairro Jardim")
    private String address;

    @Size(max = 100)
    @Schema(description = "Cidade do cliente", example = "São Paulo")
    private String city;

    @Size(max = 100)
    @Schema(description = "Estado do cliente", example = "SP")
    private String state;

    @NotNull
    @Schema(description = "Status do cliente", example = "true")
    private Boolean status;
}
