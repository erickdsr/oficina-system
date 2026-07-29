package com.distribuidora.system_oficina.client.dto;

import java.sql.Timestamp;
import com.distribuidora.system_oficina.client.entity.Client;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClientDetailsResponseDTO {

    @Schema(description = "Client identifier", example = "1")
    private Integer id;

    @Schema(description = "Client full name", example = "John Smith")
    private String name;

    @Schema(description = "Client CPF or CNPJ", example = "12345678900")
    private String cpfCnpj;

    @Schema(description = "Client type", example = "PF")
    private String clientType;

    @Schema(description = "Client email address", example = "john.smith@email.com")
    private String email;

    @Schema(description = "Client phone number", example = "11987654321")
    private String phone;

    @Schema(description = "Client secondary phone number", example = "11988887777")
    private String secondaryPhone;

    @Schema(description = "Legacy composed client address", example = "Rua das Flores, 123")
    private String address;

    @Schema(description = "Client ZIP code", example = "01001000")
    private String zipCode;

    @Schema(description = "Client street", example = "Rua das Flores")
    private String street;

    @Schema(description = "Client address number", example = "123")
    private String number;

    @Schema(description = "Client address complement", example = "Sala 4")
    private String complement;

    @Schema(description = "Client district", example = "Centro")
    private String district;

    @Schema(description = "Client city", example = "Sao Paulo")
    private String city;

    @Schema(description = "Client state", example = "SP")
    private String state;

    @Schema(description = "Client notes", example = "Prefere contato por telefone")
    private String notes;

    @Schema(description = "Client active status", example = "true")
    private Boolean status;

    @Schema(description = "Creation date", example = "2026-01-15T10:30:00")
    private Timestamp createdAt;

    @Schema(description = "Last update date", example = "2026-01-15T10:30:00")
    private Timestamp updatedAt;

    public static ClientDetailsResponseDTO fromEntity(Client client) {
        return ClientDetailsResponseDTO.builder()
                .id(client.getId())
                .name(client.getName())
                .cpfCnpj(client.getCpfCnpj())
                .clientType(client.getClientType())
                .email(client.getEmail())
                .phone(client.getPhone())
                .secondaryPhone(client.getSecondaryPhone())
                .address(client.getAddress())
                .zipCode(client.getZipCode())
                .street(client.getStreet())
                .number(client.getNumber())
                .complement(client.getComplement())
                .district(client.getDistrict())
                .city(client.getCity())
                .state(client.getState())
                .notes(client.getNotes())
                .status(client.getStatus())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .build();
    }
}
