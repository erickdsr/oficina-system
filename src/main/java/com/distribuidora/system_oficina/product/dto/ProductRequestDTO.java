package com.distribuidora.system_oficina.product.dto;

import java.math.BigDecimal;

import com.distribuidora.system_oficina.product.entity.Unit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequestDTO {
    
    @NotBlank
    @Size(max = 150)
    @Schema(description = "Nome do product", example = "Oleo")
    private String name;

    @Size(max = 255)
    @Schema(description = "description do product", example = "Oleo 5w40")
    private String description;
    
    @Size(max = 50)
    @Schema(description = "number do product", example = "12")
    private String partNumber;
    
    @Size(max = 50)
    @Schema(description = "barcode do product", example = "")
    private String barCode;
     
    @NotNull(message = "A categoria é obrigatória")
    @Positive
    @Schema(description = "ID the Category", example = "1")
    private Integer categoryId;
    
    @Schema(description = "ID the supplier", example = "2")
    private Integer supplierId;

    @Schema(description = "costprice", example = "10.00")
    private BigDecimal costPrice;
    
    @Schema(description = "saleprice", example = "15.00")
    private BigDecimal salePrice;

    @Schema(description = "Unit", example = "UN")
    private Unit unit;

    @NotNull
    @Schema(description = "Status do product", example = "true")
    private Boolean status;
}
