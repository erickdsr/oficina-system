package com.distribuidora.system_oficina.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.distribuidora.system_oficina.category.dto.CategoryRequestDTO;
import com.distribuidora.system_oficina.category.dto.CategoryResponseDTO;
import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.category.service.CategoryService;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    @DisplayName("createCategory com dados válidos deve criar a categoria corretamente")
    void createCategory_dadosValidos_deveCriarCategoriaCorretamente() {
        // Arrange
        CategoryRequestDTO request = CategoryRequestDTO.builder()
                .name("Peças")
                .description("Peças automotivas")
                .build();

        Category savedCategory = new Category();
        savedCategory.setId(1);
        savedCategory.setName("Peças");
        savedCategory.setDescription("Peças automotivas");

        when(categoryRepository.save(any(Category.class))).thenReturn(savedCategory);

        // Act
        CategoryResponseDTO result = categoryService.createCategory(request);

        // Assert
        assertThat(result.getName()).isEqualTo("Peças");
        assertThat(result.getDescription()).isEqualTo("Peças automotivas");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("getCategoryById com id inexistente deve lançar exceção")
    void getCategoryById_idNaoExistente_deveLancarExcecao() {
        // Arrange
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> categoryService.getCategoryById(99));
    }

    @Test
    @DisplayName("updateCategory com dados válidos deve atualizar name e description")
    void updateCategory_dadosValidos_deveAtualizarNameEDescription() {
        // Arrange
        Category existing = new Category();
        existing.setId(1);
        existing.setName("Antiga");
        existing.setDescription("Descrição antiga");

        CategoryRequestDTO request = CategoryRequestDTO.builder()
                .name("Nova")
                .description("Descrição nova")
                .build();

        when(categoryRepository.findById(1)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        CategoryResponseDTO result = categoryService.updateCategory(1, request);

        // Assert
        assertThat(result.getName()).isEqualTo("Nova");
        assertThat(result.getDescription()).isEqualTo("Descrição nova");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("deleteCategory com id válido deve deletar corretamente")
    void deleteCategory_idValido_deveDeletarCorretamente() {
        // Arrange
        when(categoryRepository.existsById(1)).thenReturn(true);

        // Act
        categoryService.deleteCategory(1);

        // Assert
        verify(categoryRepository).existsById(1);
        verify(categoryRepository).deleteById(1);
    }
}