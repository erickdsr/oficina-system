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
    

    @Schema(description = "Category identifier", example = "1")
    private Integer id;

    @Schema(description = "Category name", example = "Electronics")
    private String name;

    @Schema(description = "Category description", example = "Products related to electronic items")
    private String description;

    @Schema(description = "Creation date", example = "2026-01-15T10:30:00")
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
