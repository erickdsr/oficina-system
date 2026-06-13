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

    @Schema(description = "ID do fornecedor")
    private Integer id;

    @Schema(description = "Nome do fornecedor")
    private String name;

    @Schema(description = "CNPJ do fornecedor")
    private String cpfcnpj;
     
    @Schema(description = "Tipo de cliente")
    private String clientype;

    @Schema(description = "Email do fornecedor")
    private String email;

    @Schema(description = "Telefone do fornecedor")
    private String phone;

    @Schema(description = "Endereço do fornecedor")
    private String address;

    @Schema(description = "Cidade do fornecedor")
    private String city;

    @Schema(description = "Estado do fornecedor")
    private String state;

    @Schema(description = "Status do fornecedor")
    private Boolean status;

    @Schema(description = "Data de criação do fornecedor")
    private Timestamp createdAt;

    @Schema(description = "Data de atualização do fornecedor")
    private Timestamp updatedAt;

    public static ClientResponseDTO fromEntity(Client client) {
        return ClientResponseDTO.builder()
                .id(client.getId())
                .name(client.getName())
                .cpfcnpj(client.getCpfCnpj())
                .clientype(client.getClientType())
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