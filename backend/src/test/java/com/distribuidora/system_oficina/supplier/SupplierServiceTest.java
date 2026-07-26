package com.distribuidora.system_oficina.supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.distribuidora.system_oficina.deletion.DeletionResource;
import com.distribuidora.system_oficina.deletion.DeletionService;
import com.distribuidora.system_oficina.supplier.dto.SupplierRequestDTO;
import com.distribuidora.system_oficina.supplier.dto.SupplierResponseDTO;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;
import com.distribuidora.system_oficina.supplier.service.SupplierService;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SupplierServiceTest {

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private DeletionService deletionService;

    @InjectMocks
    private SupplierService supplierService;

    @Test
    @DisplayName("createSupplier com dados validos deve criar o fornecedor corretamente")
    void createSupplier_dadosValidos_deveCriarFornecedorCorretamente() {
        SupplierRequestDTO request = SupplierRequestDTO.builder()
                .name("Fornecedor A")
                .cnpj("12345678000199")
                .email("fornecedor@email.com")
                .phone("11333333333")
                .status(true)
                .build();

        Supplier savedSupplier = new Supplier();
        savedSupplier.setId(1);
        savedSupplier.setName("Fornecedor A");
        savedSupplier.setCnpj("12345678000199");
        savedSupplier.setEmail("fornecedor@email.com");

        when(supplierRepository.save(any(Supplier.class))).thenReturn(savedSupplier);

        SupplierResponseDTO result = supplierService.createSupplier(request);

        assertThat(result.getName()).isEqualTo("Fornecedor A");
        assertThat(result.getCnpj()).isEqualTo("12345678000199");
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    @DisplayName("getSupplierById com id inexistente deve lancar excecao")
    void getSupplierById_idNaoExistente_deveLancarExcecao() {
        when(supplierRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> supplierService.getSupplierById(99));
    }

    @Test
    @DisplayName("updateSupplier com dados validos deve atualizar os campos corretamente")
    void updateSupplier_dadosValidos_deveAtualizarCamposCorretamente() {
        Supplier existing = new Supplier();
        existing.setId(1);
        existing.setName("Antigo");
        existing.setCnpj("11111111111111");
        existing.setEmail("antigo@email.com");
        existing.setPhone("11111111111");
        existing.setStatus(true);

        SupplierRequestDTO request = SupplierRequestDTO.builder()
                .name("Novo")
                .cnpj("22222222222222")
                .email("novo@email.com")
                .phone("11999999999")
                .status(false)
                .build();

        when(supplierRepository.findById(1)).thenReturn(Optional.of(existing));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponseDTO result = supplierService.updateSupplier(1, request);

        assertThat(result.getName()).isEqualTo("Novo");
        assertThat(result.getStatus()).isFalse();
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    @DisplayName("deleteSupplier deve delegar para o gerenciador de exclusao")
    void deleteSupplier_deveDelegarParaDeletionService() {
        supplierService.deleteSupplier(1);

        verify(deletionService).delete(DeletionResource.SUPPLIER, 1);
    }
}
