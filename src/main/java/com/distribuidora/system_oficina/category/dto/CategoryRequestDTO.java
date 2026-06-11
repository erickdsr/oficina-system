package com.distribuidora.system_oficina.category.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

@AllArgsConstructor  
@Data
@Builder
@NoArgsConstructor
public class CategoryRequestDTO {
    

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Nome da categoria", example = "Eletrônica")
    private String name;

    @Size(max = 255)
    private String description;
    
}
