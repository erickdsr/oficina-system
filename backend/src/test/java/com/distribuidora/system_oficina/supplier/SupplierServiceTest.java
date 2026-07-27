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
        SupplierRequestDTO request = validRequest().build();

        Supplier savedSupplier = new Supplier();
        savedSupplier.setId(1);
        savedSupplier.setName("Bosch Brasil");
        savedSupplier.setLegalName("Robert Bosch Ltda.");
        savedSupplier.setTradeName("Bosch Brasil");
        savedSupplier.setCnpj("12345678000199");
        savedSupplier.setContactName("Carlos Mendes");
        savedSupplier.setEmail("compras@bosch-autopecas.com.br");
        savedSupplier.setPhone("1140001000");
        savedSupplier.setZipCode("13010000");
        savedSupplier.setStreet("Avenida Brasil");
        savedSupplier.setNumber("1000");
        savedSupplier.setDistrict("Centro");
        savedSupplier.setCity("Campinas");
        savedSupplier.setState("SP");
        savedSupplier.setStatus(true);

        when(supplierRepository.save(any(Supplier.class))).thenReturn(savedSupplier);

        SupplierResponseDTO result = supplierService.createSupplier(request);

        assertThat(result.getName()).isEqualTo("Bosch Brasil");
        assertThat(result.getCnpj()).isEqualTo("12345678000199");
        assertThat(result.getContactName()).isEqualTo("Carlos Mendes");
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

        SupplierRequestDTO request = validRequest()
                .name("Novo")
                .legalName("Novo Autopecas Ltda.")
                .tradeName("Novo")
                .cnpj("22.222.222/2222-22")
                .email("novo@email.com")
                .phone("(11) 99999-9999")
                .zipCode("09090-000")
                .state("sp")
                .status(false)
                .build();

        when(supplierRepository.findById(1)).thenReturn(Optional.of(existing));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponseDTO result = supplierService.updateSupplier(1, request);

        assertThat(result.getName()).isEqualTo("Novo");
        assertThat(result.getCnpj()).isEqualTo("22222222222222");
        assertThat(result.getPhone()).isEqualTo("11999999999");
        assertThat(result.getZipCode()).isEqualTo("09090000");
        assertThat(result.getState()).isEqualTo("SP");
        assertThat(result.getStatus()).isFalse();
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    @DisplayName("deleteSupplier deve delegar para o gerenciador de exclusao")
    void deleteSupplier_deveDelegarParaDeletionService() {
        supplierService.deleteSupplier(1);

        verify(deletionService).delete(DeletionResource.SUPPLIER, 1);
    }

    private SupplierRequestDTO.SupplierRequestDTOBuilder validRequest() {
        return SupplierRequestDTO.builder()
                .name("Bosch Brasil")
                .legalName("Robert Bosch Ltda.")
                .tradeName("Bosch Brasil")
                .cnpj("12.345.678/0001-99")
                .stateRegistration("244987321118")
                .contactName("Carlos Mendes")
                .email("compras@bosch-autopecas.com.br")
                .phone("(11) 4000-1000")
                .address("")
                .zipCode("13010-000")
                .street("Avenida Brasil")
                .number("1000")
                .district("Centro")
                .complement("")
                .city("Campinas")
                .state("SP")
                .status(true);
    }
}
