package com.distribuidora.system_oficina.role;

import java.text.Normalizer;
import java.util.Locale;

public final class RoleNameNormalizer {

    public static final String ADMIN = "ADMIN";
    public static final String MANAGER = "MANAGER";
    public static final String SALESPERSON = "SALESPERSON";
    public static final String STOCK = "STOCK";
    public static final String BUYER = "BUYER";

    private RoleNameNormalizer() {
    }

    public static String normalize(String roleName) {
        if (roleName == null) {
            return "";
        }

        String normalized = Normalizer.normalize(roleName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceFirst("^role[_\\s-]*", "")
                .replaceAll("[_\\s-]+", " ")
                .trim();

        return switch (normalized) {
            case "admin", "administrador", "administrador do sistema" -> ADMIN;
            case "manager", "gerente" -> MANAGER;
            case "salesperson", "sales person", "seller", "vendedor" -> SALESPERSON;
            case "stock", "stockkeeper", "estoque", "estoquista" -> STOCK;
            case "buyer", "comprador" -> BUYER;
            default -> normalized.toUpperCase(Locale.ROOT).replace(' ', '_');
        };
    }

    public static String authority(String roleName) {
        return "ROLE_" + normalize(roleName);
    }
}
