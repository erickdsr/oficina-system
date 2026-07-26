package com.distribuidora.system_oficina.role;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class RoleNameNormalizerTest {

    @ParameterizedTest
    @CsvSource({
            "admin, ADMIN",
            "ADMIN, ADMIN",
            "ROLE_ADMIN, ADMIN",
            "Administrador, ADMIN",
            "Administrador do sistema, ADMIN",
            "ROLE_ADMINISTRADOR_DO_SISTEMA, ADMIN",
            "gerente, MANAGER",
            "manager, MANAGER",
            "estoquista, STOCK",
            "stock, STOCK",
            "vendedor, SALESPERSON",
            "salesperson, SALESPERSON"
    })
    void normalize_deveReconhecerAliasesDeRoles(String roleName, String expected) {
        assertEquals(expected, RoleNameNormalizer.normalize(roleName));
    }

    @ParameterizedTest
    @CsvSource({
            "admin, ROLE_ADMIN",
            "gerente, ROLE_MANAGER",
            "vendedor, ROLE_SALESPERSON",
            "estoquista, ROLE_STOCK"
    })
    void authority_deveRetornarGrantedAuthorityCanonica(String roleName, String expected) {
        assertEquals(expected, RoleNameNormalizer.authority(roleName));
    }
}
