package com.distribuidora.system_oficina.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDTO {
    
    @Email
    @NotBlank
    @Schema(description = "User's email", example = "Email@email.com")
    private String email;

    @NotBlank
    @Schema(description = "User password", example = "123456")
    private String password;
}
