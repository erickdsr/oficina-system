package com.distribuidora.system_oficina.product.dto;

import java.math.BigDecimal;

import com.distribuidora.system_oficina.product.entity.Unit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
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
    
    @NotBlank(message = "O numero da peca e obrigatorio")
    @Size(max = 50)
    @Schema(description = "Numero da peca informado pelo fabricante", example = "BOS-0986AB1234")
    private String partNumber;
    
    @Size(max = 14)
    @Pattern(regexp = "^$|\\d+", message = "O codigo de barras deve conter apenas numeros")
    @Schema(description = "Codigo de barras EAN numerico do produto", example = "7891234567890")
    private String barCode;

    @NotBlank(message = "A marca e obrigatoria")
    @Size(max = 80)
    @Schema(description = "Marca/fabricante do produto", example = "Bosch")
    private String brand;
     
    @NotNull(message = "A categoria é obrigatória")
    @Positive
    @Schema(description = "ID the Category", example = "1")
    private Integer categoryId;
    
    @NotNull(message = "O fornecedor e obrigatorio")
    @Positive
    @Schema(description = "ID do fornecedor principal", example = "2")
    private Integer supplierId;

    @NotNull(message = "O preco de custo e obrigatorio")
    @PositiveOrZero(message = "O preco de custo nao pode ser negativo")
    @Schema(description = "costprice", example = "10.00")
    private BigDecimal costPrice;
    
    @NotNull(message = "O preco de venda e obrigatorio")
    @PositiveOrZero(message = "O preco de venda nao pode ser negativo")
    @Schema(description = "saleprice", example = "15.00")
    private BigDecimal salePrice;

    @NotNull(message = "A unidade e obrigatoria")
    @Schema(description = "Unit", example = "UN")
    private Unit unit;

    @Schema(description = "Confirma venda abaixo do custo", example = "false")
    private Boolean allowSaleBelowCost;

    @NotNull
    @Schema(description = "Status do product", example = "true")
    private Boolean status;
}
