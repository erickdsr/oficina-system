package com.distribuidora.system_oficina.category.dto;

import java.sql.Timestamp;

import com.distribuidora.system_oficina.category.entity.Category;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryResponseDTO {
    

    @Schema(description = "ID da categoria")
    private Integer id;

    @Schema(description = "Nome da categoria")
    private String name;

    @Schema(description = "Descrição da categoria")
    private String description;

    @Schema(description = "Data de criação da categoria")
    private Timestamp createdAt;

    public static CategoryResponseDTO fromEntity(Category category) {
        return CategoryResponseDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
