package com.distribuidora.system_oficina.employee.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor  
@Data
@Builder
@NoArgsConstructor
public class EmployeeRequestDTO {
    
    @NotBlank
    @Size(max = 150)
    @Schema(description = "Nome do funcionario", example = "funcionario João")
    private String name;
    
    @NotBlank
    @Size(max = 11)
    @Schema(description = "CPF do funcionario", example = "123.456.789.00")
    private String cpf;
    
    @NotBlank
    @Size(max = 254)
    @Schema(description = "Email do funcionario", example = "contato@funcionarioxyz.com")
    private String email;

    @NotBlank
    @Size(min = 6, max = 100)
    @Schema(description = "Senha do funcionário", example = "senha123")
    private String password;

    @NotBlank
    @Size(max = 254)
    @Schema(description = "Role", example = "funcionario")
    private String roleName;
    
    @Size(max = 20)
    @Schema(description = "Telefone do funcionario", example = "(11) 98765-4321")
    private String phone;

    @NotNull
    @Schema(description = "Status do funcionario", example = "true")
    private Boolean status;
}
