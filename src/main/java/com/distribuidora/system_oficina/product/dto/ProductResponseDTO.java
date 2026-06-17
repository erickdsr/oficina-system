package com.distribuidora.system_oficina.product.dto;

import java.math.BigDecimal;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.entity.Unit;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDTO {
    
    @Schema(description = "id do product")
    private Integer id;

    @Schema(description = "Nome do product")
    private String name;

    @Schema(description = "description do product")
    private String description;
    
    @Schema(description = "number do product")
    private String partNumber;
   
    @Schema(description = "barcode do product")
    private String barCode;
  
    @Schema(description = "category the product")
    private Integer categoryId;

    @Schema(description = "category the Name")
    private String categoryName;
    
    @Schema(description = "supplier the product")
    private Integer supplierId;

    @Schema(description = "supplier the name")
    private String supplierName;
  
    @Schema(description = "costprice")
    private BigDecimal costPrice;

    @Schema(description = "saleprice")
    private BigDecimal salePrice;

    @Schema(description = "Unit")
    private Unit unit;

    @Schema(description = "Status do product")
    private Boolean status;

    @Schema(description = "Data de criação do fornecedor")
    private Timestamp createdAt;

    @Schema(description = "Data de atualização do fornecedor")
    private Timestamp updatedAt;

    public static ProductResponseDTO fromEntity(Product product) {
        return ProductResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .partNumber(product.getPartNumber())
                .barCode(product.getBarCode())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .supplierId(product.getSupplier() != null ? product.getSupplier().getId() : null)
                .supplierName(product.getSupplier() != null ? product.getSupplier().getName() : null)
                .costPrice(product.getCostPrice())
                .salePrice(product.getSalePrice())
                .unit(product.getUnit())
                .status(product.getStatus())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}