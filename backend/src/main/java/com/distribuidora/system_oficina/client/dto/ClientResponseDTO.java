package com.distribuidora.system_oficina.client.dto;

import java.sql.Timestamp;
import com.distribuidora.system_oficina.client.entity.Client;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClientResponseDTO {

    @Schema(description = "Client identifier", example = "1")
    private Integer id;

    @Schema(description = "Client full name", example = "John Smith")
    private String name;

    @Schema(description = "Client CPF or CNPJ", example = "123.456.789-00")
    private String cpfCnpj;

    @Schema(description = "Client type", example = "INDIVIDUAL")
    private String clientType;

    @Schema(description = "Client email address", example = "john.smith@email.com")
    private String email;

    @Schema(description = "Client phone number", example = "(11) 98765-4321")
    private String phone;

    @Schema(description = "Client address", example = "Main Street, 123")
    private String address;

    @Schema(description = "Client city", example = "São Paulo")
    private String city;

    @Schema(description = "Client state", example = "SP")
    private String state;

    @Schema(description = "Client active status", example = "true")
    private Boolean status;

    @Schema(description = "Creation date", example = "2026-01-15T10:30:00")
    private Timestamp createdAt;

    @Schema(description = "Last update date", example = "2026-01-15T10:30:00")
    private Timestamp updatedAt;

    public static ClientResponseDTO fromEntity(Client client) {
        return ClientResponseDTO.builder()
                .id(client.getId())
                .name(client.getName())
                .cpfCnpj(client.getCpfCnpj())
                .clientType(client.getClientType())
                .email(client.getEmail())
                .phone(client.getPhone())
                .address(client.getAddress())
                .city(client.getCity())
                .state(client.getState())
                .status(client.getStatus())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .build();
    }
}