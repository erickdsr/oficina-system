package com.distribuidora.system_oficina.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import com.distribuidora.system_oficina.category.dto.CategoryRequestDTO;
import com.distribuidora.system_oficina.category.dto.CategoryResponseDTO;
import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.category.service.CategoryService;

import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {
    
    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    
    @Test
    @DisplayName("Must create a category correctly")
    void shouldCreateCategoryCorrectly() {

        CategoryRequestDTO requestDto = new CategoryRequestDTO();
        requestDto.setName("Motor");
        requestDto.setDescription("Motores, bielas e cabeçotes");

        Category savedCategory = new Category();
        savedCategory.setId(1);
        savedCategory.setName("Motor");
        savedCategory.setDescription("Motores, bielas e cabeçotes");

        when(categoryRepository.save(any(Category.class)))
            .thenReturn(savedCategory);

        CategoryResponseDTO result = categoryService.createCategory(requestDto);

        assertThat(result).isNotNull();

        verify(categoryRepository).save(any(Category.class));
    }
    @Test
    @DisplayName("Should throw exception when category ID does not exist.")
    void shouldThrowExceptionWhenIdNotFound() {

        int idInexistente = 99;

        when(categoryRepository.findById(idInexistente))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getCategoryById(idInexistente))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Category not found");

        verify(categoryRepository).findById(idInexistente);
    }
    @Test
    @DisplayName("Must update a category correctly when ID exists")
    void shouldUpdateCategoryCorrectly() {

        int idUpdate = 1;

        CategoryRequestDTO requestDto = new CategoryRequestDTO();
        requestDto.setName("Motor V8");
        requestDto.setDescription("Motores de alta performance");

        Category oldCategory = new Category();
        oldCategory.setId(idUpdate);
        oldCategory.setName("Motor");
        oldCategory.setDescription("Motores antigos");

        Category updatedCategory = new Category();
        updatedCategory.setId(idUpdate);
        updatedCategory.setName("Motor V8");
        updatedCategory.setDescription("Motores de alta performance");

        when(categoryRepository.findById(idUpdate))
            .thenReturn(Optional.of(oldCategory));

        when(categoryRepository.save(any(Category.class)))
            .thenReturn(updatedCategory);

        CategoryResponseDTO result = categoryService.updateCategory(idUpdate, requestDto);

        assertThat(result).isNotNull();

        verify(categoryRepository).findById(idUpdate);
        verify(categoryRepository).save(any(Category.class));
    }
    @Test
    @DisplayName("It should correctly delete an ID.")
    void shouldDeleteCorrectly(){

        int idDelete = 1;

        when(categoryRepository.existsById(idDelete))
            .thenReturn(true);
        
        categoryService.deleteCategory(idDelete);

        verify(categoryRepository).existsById(idDelete);
        verify(categoryRepository).deleteById(idDelete);

    }
}