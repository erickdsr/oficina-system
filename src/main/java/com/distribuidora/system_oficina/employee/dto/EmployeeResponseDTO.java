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
    
     @Schema(description = "ID do funcionario")
    private Integer id;

    @Schema(description = "Nome do funcionario")
    private String name;

    @Schema(description = "CNPJ do funcionario")
    private String cpf;
     
    @Schema(description = "Email do funcionario")
    private String email;

    @Schema(description = "Telefone do funcionario")
    private String phone;

    @Schema(description = "Role EX:funcionario")
    private String roleName;

    @Schema(description = "Status do funcionario")
    private Boolean status;

    @Schema(description = "Data de criação do funcionario")
    private Timestamp createdAt;

    @Schema(description = "Data de atualização do funcionario")
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