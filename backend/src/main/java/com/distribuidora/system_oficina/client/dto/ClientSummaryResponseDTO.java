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
public class ClientSummaryResponseDTO {

    @Schema(description = "Total active clients", example = "8")
    private long activeCount;

    @Schema(description = "Total inactive clients", example = "2")
    private long inactiveCount;

    @Schema(description = "Total clients", example = "10")
    private long totalCount;
}
