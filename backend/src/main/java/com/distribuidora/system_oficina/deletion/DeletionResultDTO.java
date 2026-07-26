package com.distribuidora.system_oficina.deletion;

public record DeletionResultDTO(
        String entity,
        Integer id,
        DeletionMode mode,
        String message,
        String detail,
        DeletionReportDTO report) {
}
