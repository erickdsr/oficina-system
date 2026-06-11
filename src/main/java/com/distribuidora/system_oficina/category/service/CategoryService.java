package com.distribuidora.system_oficina.category.service;
import org.springframework.stereotype.Service;
import com.distribuidora.system_oficina.category.dto.CategoryRequestDTO;
import com.distribuidora.system_oficina.category.dto.CategoryResponseDTO;
import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    private Category toEntity(CategoryRequestDTO dto) {
        Category category = new Category();
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        return category;
    }
    private CategoryResponseDTO toResponseDTO(Category entity) {
        return CategoryResponseDTO.fromEntity(entity);
    }
    public List<CategoryResponseDTO> listCategories(){
        return categoryRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public CategoryResponseDTO getCategoryById(Integer id){
        return toResponseDTO(categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found")));
    }
    public CategoryResponseDTO createCategory(CategoryRequestDTO dto){
        Category category = toEntity(dto);
        return toResponseDTO(categoryRepository.save(category));
    }
    public CategoryResponseDTO updateCategory(Integer id, CategoryRequestDTO dto){
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found"));
            category.setName(dto.getName());
            category.setDescription(dto.getDescription());
        return toResponseDTO(categoryRepository.save(category));
    }
    public void deleteCategory(Integer id){
        categoryRepository.deleteById(id);
    }
}
