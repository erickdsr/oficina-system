package com.distribuidora.system_oficina.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.distribuidora.system_oficina.category.dto.CategoryRequestDTO;
import com.distribuidora.system_oficina.category.dto.CategoryResponseDTO;
import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.category.service.CategoryService;
import com.distribuidora.system_oficina.deletion.DeletionResource;
import com.distribuidora.system_oficina.deletion.DeletionService;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private DeletionService deletionService;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    @DisplayName("createCategory com dados validos deve criar a categoria corretamente")
    void createCategory_dadosValidos_deveCriarCategoriaCorretamente() {
        CategoryRequestDTO request = CategoryRequestDTO.builder()
                .name("Pecas")
                .description("Pecas automotivas")
                .build();

        Category savedCategory = new Category();
        savedCategory.setId(1);
        savedCategory.setName("Pecas");
        savedCategory.setDescription("Pecas automotivas");
        savedCategory.setStatus(true);

        when(categoryRepository.save(any(Category.class))).thenReturn(savedCategory);

        CategoryResponseDTO result = categoryService.createCategory(request);

        assertThat(result.getName()).isEqualTo("Pecas");
        assertThat(result.getDescription()).isEqualTo("Pecas automotivas");
        assertThat(result.getStatus()).isTrue();
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("getCategoryById com id inexistente deve lancar excecao")
    void getCategoryById_idNaoExistente_deveLancarExcecao() {
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> categoryService.getCategoryById(99));
    }

    @Test
    @DisplayName("updateCategory com dados validos deve atualizar os campos")
    void updateCategory_dadosValidos_deveAtualizarCampos() {
        Category existing = new Category();
        existing.setId(1);
        existing.setName("Antiga");
        existing.setDescription("Descricao antiga");
        existing.setStatus(true);

        CategoryRequestDTO request = CategoryRequestDTO.builder()
                .name("Nova")
                .description("Descricao nova")
                .status(false)
                .build();

        when(categoryRepository.findById(1)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResponseDTO result = categoryService.updateCategory(1, request);

        assertThat(result.getName()).isEqualTo("Nova");
        assertThat(result.getDescription()).isEqualTo("Descricao nova");
        assertThat(result.getStatus()).isFalse();
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("deleteCategory deve delegar para o gerenciador de exclusao")
    void deleteCategory_deveDelegarParaDeletionService() {
        categoryService.deleteCategory(1);

        verify(deletionService).delete(DeletionResource.CATEGORY, 1);
    }

    @Test
    @DisplayName("forceDeleteCategory deve delegar para exclusao forcada centralizada")
    void forceDeleteCategory_deveDelegarParaDeletionService() {
        categoryService.forceDeleteCategory(1);

        verify(deletionService).forceDelete(DeletionResource.CATEGORY, 1);
    }
}
