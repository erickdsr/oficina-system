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
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS internal_code varchar(20)");
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS brand varchar(80)");
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_supplier_id integer");
            jdbcTemplate.execute("ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS previous_balance integer");
            jdbcTemplate.execute("ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS current_balance integer");
            jdbcTemplate.execute("UPDATE products SET internal_code = 'PROD-' || LPAD(id::text, 6, '0') WHERE internal_code IS NULL OR TRIM(internal_code) = '' OR internal_code LIKE 'TMP-%'");
            jdbcTemplate.execute("UPDATE products SET part_number = TRIM(part_number) WHERE part_number IS NOT NULL");
            jdbcTemplate.execute("UPDATE products SET barcode = TRIM(barcode) WHERE barcode IS NOT NULL");
            jdbcTemplate.execute("UPDATE products SET barcode = NULL WHERE barcode IS NOT NULL AND (TRIM(barcode) = '' OR barcode !~ '^[0-9]+$' OR barcode LIKE 'PROD-%')");
            jdbcTemplate.execute("UPDATE products SET part_number = 'LEGACY-' || LPAD(id::text, 6, '0') WHERE part_number IS NULL OR TRIM(part_number) = ''");
            jdbcTemplate.execute("""
                    WITH duplicated_parts AS (
                        SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(part_number) ORDER BY id) AS position
                        FROM products
                        WHERE part_number IS NOT NULL
                    )
                    UPDATE products
                    SET part_number = products.part_number || '-' || LPAD(products.id::text, 6, '0')
                    FROM duplicated_parts
                    WHERE products.id = duplicated_parts.id AND duplicated_parts.position > 1
                    """);
            jdbcTemplate.execute("""
                    WITH duplicated_barcodes AS (
                        SELECT id, ROW_NUMBER() OVER (PARTITION BY barcode ORDER BY id) AS position
                        FROM products
                        WHERE barcode IS NOT NULL
                    )
                    UPDATE products
                    SET barcode = NULL
                    FROM duplicated_barcodes
                    WHERE products.id = duplicated_barcodes.id AND duplicated_barcodes.position > 1
                    """);
            jdbcTemplate.execute("UPDATE products SET primary_supplier_id = supplier_id WHERE primary_supplier_id IS NULL AND supplier_id IS NOT NULL");
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS product_supplier_options (
                        id serial PRIMARY KEY,
                        product_id integer NOT NULL REFERENCES products(id),
                        supplier_id integer NOT NULL REFERENCES suppliers(id),
                        cost_price numeric(19, 2),
                        lead_time_days integer,
                        is_primary boolean NOT NULL DEFAULT false,
                        status boolean NOT NULL DEFAULT true,
                        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT uk_product_supplier_options_product_supplier UNIQUE (product_id, supplier_id)
                    )
                    """);
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_products_internal_code ON products(internal_code)");
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_products_part_number_lower ON products(LOWER(part_number))");
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_products_barcode ON products(barcode) WHERE barcode IS NOT NULL");
        };
    }

    @Bean
    @Order(3)
    ApplicationRunner normalizeAutomotiveProductData(JdbcTemplate jdbcTemplate) {
        return args -> {
            applyProductBrandAndSupplier(jdbcTemplate, "%pastilha%bosch%", "Bosch", "Bosch Brasil");
            applyProductBrandAndSupplier(jdbcTemplate, "%filtro%mahle%", "Mahle", "Mahle Metal Leve");
            applyProductBrandAndSupplier(jdbcTemplate, "%correia%continental%", "Continental", "Continental");
            applyProductBrandAndSupplier(jdbcTemplate, "%rolamento%skf%", "SKF", "SKF");
            applyProductBrandAndSupplier(jdbcTemplate, "%amortecedor%cofap%", "Cofap", "Cofap");
            applyProductBrandAndSupplier(jdbcTemplate, "%bobina%ngk%", "NGK", "NGK");
            applyProductBrandAndSupplier(jdbcTemplate, "%sensor%map%", "Delphi", "Delphi Technologies");
            applyProductBrandAndSupplier(jdbcTemplate, "%disco%freio%", "Fras-le", "Fras-le");
            applyProductBrandAndSupplier(jdbcTemplate, "%terminal%direcao%", "TRW", "TRW");
            applyProductBrandAndSupplier(jdbcTemplate, "%terminal%direção%", "TRW", "TRW");
            applyProductBrandAndSupplier(jdbcTemplate, "%oleo%lubrax%", "Lubrax", "Lubrax Distribuidora");
            applyProductBrandAndSupplier(jdbcTemplate, "%óleo%lubrax%", "Lubrax", "Lubrax Distribuidora");
            jdbcTemplate.execute("UPDATE products SET brand = 'Nao definida' WHERE brand IS NULL OR TRIM(brand) = '' OR LOWER(brand) IN ('oleo', 'óleo', 'filtro', 'freio', 'motor')");
            jdbcTemplate.execute("UPDATE products SET supplier_id = primary_supplier_id WHERE supplier_id IS NULL AND primary_supplier_id IS NOT NULL");
        };
    }

    private void applyProductBrandAndSupplier(JdbcTemplate jdbcTemplate, String productNamePattern, String brand, String supplierName) {
        jdbcTemplate.update("""
                UPDATE products
                SET brand = ?,
                    supplier_id = suppliers.id,
                    primary_supplier_id = suppliers.id
                FROM suppliers
                WHERE LOWER(products.name) LIKE LOWER(?)
                    AND (suppliers.name = ? OR suppliers.trade_name = ?)
                """, brand, productNamePattern, supplierName, supplierName);
    }
}
