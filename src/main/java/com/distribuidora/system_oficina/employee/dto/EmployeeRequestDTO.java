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
    @Schema(description = "Employee full name", example = "João Silva")
    private String name;
    
    @NotBlank
    @Size(max = 11)
    @Schema(description = "Employee CPF", example = "123.456.789-00")
    private String cpf;
    
    @NotBlank
    @Size(max = 254)
    @Schema(description = "Employee email address", example = "joao.silva@email.com")
    private String email;

    @NotBlank
    @Size(min = 6, max = 100)
    @Schema(description = "Employee password", example = "password123")
    private String password;

    @NotBlank
    @Size(max = 254)
    @Schema(description = "Employee role name", example = "employee")
    private String roleName;
    
    @Size(max = 20)
    @Schema(description = "Employee phone number", example = "(11) 98765-4321")
    private String phone;

    @NotNull
    @Schema(description = "Employee active status", example = "true")
    private Boolean status;
}
