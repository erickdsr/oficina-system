package com.distribuidora.system_oficina.client.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClientCityFilterOptionDTO {

    @Schema(description = "State abbreviation", example = "SP")
    private String estado;

    @Schema(description = "City name", example = "Campinas")
    private String cidade;

    @Schema(description = "Number of clients in this city", example = "3")
    private long quantidadeClientes;
}
