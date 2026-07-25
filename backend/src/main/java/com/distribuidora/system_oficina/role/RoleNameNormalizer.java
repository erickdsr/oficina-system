package com.distribuidora.system_oficina.role;

import java.text.Normalizer;
import java.util.Locale;

public final class RoleNameNormalizer {

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
                .replaceFirst("^role[_\\s-]*", "");

        return switch (normalized) {
            case "admin", "administrador" -> "admin";
            case "gerente", "manager" -> "gerente";
            case "vendedor" -> "vendedor";
            case "estoquista" -> "estoquista";
            default -> normalized;
        };
    }

    public static String authority(String roleName) {
        return "ROLE_" + normalize(roleName).toUpperCase(Locale.ROOT);
    }
}
