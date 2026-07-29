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
            jdbcTemplate.execute("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS legal_name varchar(180)");
            jdbcTemplate.execute("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS trade_name varchar(150)");
            jdbcTemplate.execute("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS state_registration varchar(30)");
            jdbcTemplate.execute("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name varchar(120)");
            jdbcTemplate.execute("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS zip_code varchar(8)");
            jdbcTemplate.execute("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS street varchar(150)");
            jdbcTemplate.execute("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS number varchar(20)");
            jdbcTemplate.execute("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS district varchar(100)");
            jdbcTemplate.execute("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS complement varchar(120)");
            jdbcTemplate.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS secondary_phone varchar(20)");
            jdbcTemplate.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS zip_code varchar(8)");
            jdbcTemplate.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS street varchar(150)");
            jdbcTemplate.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS number varchar(20)");
            jdbcTemplate.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS complement varchar(120)");
            jdbcTemplate.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS district varchar(100)");
            jdbcTemplate.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes varchar(1000)");
        };
    }
}
