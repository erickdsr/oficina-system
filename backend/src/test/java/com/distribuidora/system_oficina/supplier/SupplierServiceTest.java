package com.distribuidora.system_oficina.supplier;

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

import com.distribuidora.system_oficina.supplier.dto.SupplierRequestDTO;
import com.distribuidora.system_oficina.supplier.dto.SupplierResponseDTO;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;
import com.distribuidora.system_oficina.supplier.service.SupplierService;

@ExtendWith(MockitoExtension.class)
class SupplierServiceTest {

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private SupplierService supplierService;

    @Test
    @DisplayName("createSupplier com dados válidos deve criar o fornecedor corretamente")
    void createSupplier_dadosValidos_deveCriarFornecedorCorretamente() {
        // Arrange
        SupplierRequestDTO request = SupplierRequestDTO.builder()
                .name("Fornecedor A")
                .cnpj("12345678000199")
                .email("fornecedor@email.com")
                .phone("11333333333")
                .address("Rua das Peças")
                .city("São Paulo")
                .state("SP")
                .status(true)
                .build();

        Supplier savedSupplier = new Supplier();
        savedSupplier.setId(1);
        savedSupplier.setName("Fornecedor A");
        savedSupplier.setCnpj("12345678000199");
        savedSupplier.setEmail("fornecedor@email.com");

        when(supplierRepository.save(any(Supplier.class))).thenReturn(savedSupplier);

        // Act
        SupplierResponseDTO result = supplierService.createSupplier(request);

        // Assert
        assertThat(result.getName()).isEqualTo("Fornecedor A");
        assertThat(result.getCnpj()).isEqualTo("12345678000199");
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    @DisplayName("getSupplierById com id inexistente deve lançar exceção")
    void getSupplierById_idNaoExistente_deveLancarExcecao() {
        // Arrange
        when(supplierRepository.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> supplierService.getSupplierById(99));
    }

    @Test
    @DisplayName("updateSupplier com dados válidos deve atualizar os campos corretamente")
    void updateSupplier_dadosValidos_deveAtualizarCamposCorretamente() {
        // Arrange
        Supplier existing = new Supplier();
        existing.setId(1);
        existing.setName("Antigo");
        existing.setCnpj("11111111111111");
        existing.setEmail("antigo@email.com");
        existing.setPhone("11111111111");
        existing.setAddress("Rua antiga");
        existing.setCity("Campinas");
        existing.setState("SP");

        SupplierRequestDTO request = SupplierRequestDTO.builder()
                .name("Novo")
                .cnpj("22222222222222")
                .email("novo@email.com")
                .phone("11999999999")
                .address("Rua nova")
                .city("São Paulo")
                .state("SP")
                .status(false)
                .build();

        when(supplierRepository.findById(1)).thenReturn(Optional.of(existing));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        SupplierResponseDTO result = supplierService.updateSupplier(1, request);

        // Assert
        assertThat(result.getName()).isEqualTo("Novo");
        assertThat(result.getEmail()).isEqualTo("novo@email.com");
        assertThat(result.getStatus()).isFalse();
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    @DisplayName("deleteSupplier com id válido deve deletar corretamente")
    void deleteSupplier_idValido_deveDeletarCorretamente() {
        // Arrange
        when(supplierRepository.existsById(1)).thenReturn(true);

        // Act
        supplierService.deleteSupplier(1);

        // Assert
        verify(supplierRepository).existsById(1);
        verify(supplierRepository).deleteById(1);
    }
}
