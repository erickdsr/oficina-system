package com.distribuidora.system_oficina.deletion;

import java.util.Map;

public record DeletionReportDTO(
        String entity,
        Integer id,
        boolean hasDependencies,
        boolean physicalDeletionAllowed,
        Map<String, Long> dependencies) {
}
