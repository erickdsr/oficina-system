package com.distribuidora.system_oficina.category.controller;


import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import com.distribuidora.system_oficina.category.dto.CategoryRequestDTO;
import com.distribuidora.system_oficina.category.dto.CategoryResponseDTO;
import com.distribuidora.system_oficina.category.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

@RequiredArgsConstructor
@RestController
@RequestMapping("/categories")
@Tag(name = "Categories", description = "Operations related to categories")
public class CategoryController {

   private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "List categories", description = "Obtenha uma lista de todas as categorias.")
    public ResponseEntity<List<CategoryResponseDTO>> listCategory() {
        return ResponseEntity.ok(categoryService.listCategory());
    }
    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID", description = "Obtenha uma categoria pelo seu ID")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }
    @PostMapping
    @Operation(summary = "Create category", description = "Crie uma nova categoria")
    public ResponseEntity<CategoryResponseDTO> createCategory(@RequestBody @Valid CategoryRequestDTO requestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(requestDTO));
    }
    @PutMapping("/{id}")
    @Operation(summary = "Update category", description = "Atualizar uma categoria existente")
    public ResponseEntity<CategoryResponseDTO> updateCategory(@PathVariable Integer id, @RequestBody @Valid CategoryRequestDTO requestDTO) {    
        return ResponseEntity.ok(categoryService.updateCategory(id, requestDTO));
    }
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete category", description = "Excluir uma categoria existente")
    public ResponseEntity<String> deleteCategory(@PathVariable Integer id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}