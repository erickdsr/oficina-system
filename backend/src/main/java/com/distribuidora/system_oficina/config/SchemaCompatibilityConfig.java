package com.distribuidora.system_oficina.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@Profile("!test")
public class SchemaCompatibilityConfig {

    @Bean
    @Order(0)
    ApplicationRunner ensureSchemaCompatibility(JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS status boolean NOT NULL DEFAULT true");
            jdbcTemplate.execute("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS active boolean DEFAULT true");
        };
    }
}
