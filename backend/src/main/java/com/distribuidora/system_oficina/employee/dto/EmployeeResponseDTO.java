package com.distribuidora.system_oficina.employee.dto;

import com.distribuidora.system_oficina.employee.entity.Employee;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponseDTO {
    
    @Schema(description = "Employee identifier", example = "1")
    private Integer id;

    @Schema(description = "Employee full name", example = "João Silva")
    private String name;

    @Schema(description = "Employee CPF", example = "123.456.789-00")
    private String cpf;

    @Schema(description = "Employee email address", example = "joao.silva@email.com")
    private String email;

    @Schema(description = "Employee phone number", example = "(11) 98765-4321")
    private String phone;

    @Schema(description = "Employee role name", example = "employee")
    private String roleName;

    @Schema(description = "Employee active status", example = "true")
    private Boolean status;

    @Schema(description = "Creation date", example = "2026-01-15T10:30:00")
    private Timestamp createdAt;

    @Schema(description = "Last update date", example = "2026-01-15T10:30:00")
    private Timestamp updatedAt;

    public static EmployeeResponseDTO fromEntity(Employee employee) {
        return EmployeeResponseDTO.builder()
                .id(employee.getId())
                .name(employee.getName())
                .cpf(employee.getCpf())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .roleName(employee.getRole().getName())
                .status(employee.getStatus())
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .build();
    }
}