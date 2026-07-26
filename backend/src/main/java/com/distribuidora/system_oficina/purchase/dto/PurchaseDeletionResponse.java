package com.distribuidora.system_oficina.purchase.dto;

import java.util.Map;

public record PurchaseDeletionResponse(
        boolean success,
        PurchaseDeletionAction action,
        String message,
        Map<String, Long> dependencies) {
}
