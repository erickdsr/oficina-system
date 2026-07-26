package com.distribuidora.system_oficina.category.controller;


import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import com.distribuidora.system_oficina.category.dto.CategoryRequestDTO;
import com.distribuidora.system_oficina.category.dto.CategoryResponseDTO;
import com.distribuidora.system_oficina.category.service.CategoryService;
import com.distribuidora.system_oficina.deletion.DeletionReportDTO;
import com.distribuidora.system_oficina.deletion.DeletionResultDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;

@RequiredArgsConstructor
@RestController
@RequestMapping("/categories")
@Tag(name = "Categories", description = "Category management endpoints")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "List all categories", description = "Returns all registered categories")
    public ResponseEntity<List<CategoryResponseDTO>> listCategory(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(categoryService.listCategory(includeInactive));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID", description = "Returns the category matching the provided identifier")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new category", description = "Creates a new category with the supplied details")
    public ResponseEntity<CategoryResponseDTO> createCategory(@RequestBody @Valid CategoryRequestDTO requestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(requestDTO));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a category", description = "Updates the category information for the specified identifier")
    public ResponseEntity<CategoryResponseDTO> updateCategory(@PathVariable Integer id, @RequestBody @Valid CategoryRequestDTO requestDTO) {
        return ResponseEntity.ok(categoryService.updateCategory(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a category", description = "Deletes the category identified by the provided ID")
    public ResponseEntity<DeletionResultDTO> deleteCategory(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.deleteCategory(id));
    }

    @DeleteMapping("/{id}/force")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Force delete a category", description = "Deletes the category, its products and product dependencies")
    public ResponseEntity<DeletionResultDTO> forceDeleteCategory(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.forceDeleteCategory(id));
    }

    @GetMapping("/{id}/deletion-report")
    @Operation(summary = "Get category deletion report", description = "Returns the dependencies that affect category deletion")
    public ResponseEntity<DeletionReportDTO> getDeletionReport(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.getDeletionReport(id));
    }
}
