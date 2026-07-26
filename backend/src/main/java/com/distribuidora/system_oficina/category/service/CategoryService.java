package com.distribuidora.system_oficina.category.service;

import com.distribuidora.system_oficina.category.dto.CategoryRequestDTO;
import com.distribuidora.system_oficina.category.dto.CategoryResponseDTO;
import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.deletion.DeletionReportDTO;
import com.distribuidora.system_oficina.deletion.DeletionResource;
import com.distribuidora.system_oficina.deletion.DeletionResultDTO;
import com.distribuidora.system_oficina.deletion.DeletionService;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@RequiredArgsConstructor
@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final DeletionService deletionService;

    private Category toEntity(CategoryRequestDTO dto) {
        Category category = new Category();
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        return category;
    }
    private CategoryResponseDTO toResponseDTO(Category entity) {
        return CategoryResponseDTO.fromEntity(entity);
    }
    public List<CategoryResponseDTO> listCategory(boolean includeInactive) {
        return (includeInactive ? categoryRepository.findAll() : categoryRepository.findByStatus(true)).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public List<CategoryResponseDTO> listCategory() {
        return listCategory(false);
    }
    public CategoryResponseDTO getCategoryById(Integer id) {
        return toResponseDTO(categoryRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found with id: " + id)));
    }
    public CategoryResponseDTO createCategory(CategoryRequestDTO dto) {
        Category category = toEntity(dto);
        return toResponseDTO(categoryRepository.save(category));
    }
    public CategoryResponseDTO updateCategory(Integer id, CategoryRequestDTO dto) {
        Category category = categoryRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found with id: " + id));
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        return toResponseDTO(categoryRepository.save(category));
    }
    @Transactional
    public DeletionResultDTO deleteCategory(Integer id) {
        return deletionService.delete(DeletionResource.CATEGORY, id);
    }

    @Transactional
    public DeletionResultDTO forceDeleteCategory(Integer id) {
        return deletionService.forceDelete(DeletionResource.CATEGORY, id);
    }

    public DeletionReportDTO getDeletionReport(Integer id) {
        return deletionService.report(DeletionResource.CATEGORY, id);
    }
}
