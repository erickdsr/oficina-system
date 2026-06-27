package com.distribuidora.system_oficina.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {
    
    @Schema(description = "Jwt gerado", example = "asg12c970b42734520ccf34r341xe1872xe1")
    private String token;
    @Schema(description = "Tipo", example = "Bearer")
    private String type;
    @Schema(description = "Employee id", example = "1")
    private Integer employeeId;
    @Schema(description = "User role", example = "Employee")
    private String role;
    @Schema(description = "Username", example = "joão")
    private String name;
}
