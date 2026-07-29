package com.distribuidora.system_oficina.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.distribuidora.system_oficina.client.dto.ClientRequestDTO;
import com.distribuidora.system_oficina.client.dto.ClientDetailsResponseDTO;
import com.distribuidora.system_oficina.client.entity.Client;
import com.distribuidora.system_oficina.client.repository.ClientRepository;
import com.distribuidora.system_oficina.client.service.ClientService;
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
class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private DeletionService deletionService;

    @InjectMocks
    private ClientService clientService;

    @Test
    @DisplayName("createClient com dados validos deve criar o cliente corretamente")
    void createClient_dadosValidos_deveCriarClienteCorretamente() {
        ClientRequestDTO request = ClientRequestDTO.builder()
                .name("Maria")
                .cpfCnpj("12345678900")
                .email("maria@email.com")
                .clientType("PF")
                .phone("11999999999")
                .secondaryPhone("11888887777")
                .zipCode("01001000")
                .street("Rua A")
                .number("120")
                .complement("Casa")
                .district("Centro")
                .city("Sao Paulo")
                .state("SP")
                .notes("Cliente prefere contato pela manha")
                .status(true)
                .build();

        Client savedClient = new Client();
        savedClient.setId(1);
        savedClient.setName("Maria");
        savedClient.setCpfCnpj("12345678900");
        savedClient.setEmail("maria@email.com");
        savedClient.setPhone("11999999999");
        savedClient.setSecondaryPhone("11888887777");
        savedClient.setZipCode("01001000");
        savedClient.setStreet("Rua A");
        savedClient.setNumber("120");
        savedClient.setComplement("Casa");
        savedClient.setDistrict("Centro");
        savedClient.setCity("Sao Paulo");
        savedClient.setState("SP");
        savedClient.setNotes("Cliente prefere contato pela manha");

        when(clientRepository.save(any(Client.class))).thenReturn(savedClient);

        ClientDetailsResponseDTO result = clientService.createClient(request);

        assertThat(result.getName()).isEqualTo("Maria");
        assertThat(result.getCpfCnpj()).isEqualTo("12345678900");
        assertThat(result.getSecondaryPhone()).isEqualTo("11888887777");
        assertThat(result.getZipCode()).isEqualTo("01001000");
        assertThat(result.getStreet()).isEqualTo("Rua A");
        assertThat(result.getNumber()).isEqualTo("120");
        assertThat(result.getComplement()).isEqualTo("Casa");
        assertThat(result.getDistrict()).isEqualTo("Centro");
        assertThat(result.getNotes()).isEqualTo("Cliente prefere contato pela manha");
        verify(clientRepository).save(any(Client.class));
    }

    @Test
    @DisplayName("getClientSummary deve retornar totais independentes da listagem filtrada")
    void getClientSummary_deveRetornarTotaisPorStatus() {
        when(clientRepository.countByStatus(true)).thenReturn(8L);
        when(clientRepository.countByStatus(false)).thenReturn(2L);

        var result = clientService.getClientSummary();

        assertThat(result.getActiveCount()).isEqualTo(8);
        assertThat(result.getInactiveCount()).isEqualTo(2);
        assertThat(result.getTotalCount()).isEqualTo(10);
    }

    @Test
    @DisplayName("getClientById com id inexistente deve lancar excecao")
    void getClientById_idNaoExistente_deveLancarExcecao() {
        when(clientRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> clientService.getClientById(99));
    }

    @Test
    @DisplayName("updateClient com dados validos deve atualizar os campos corretamente")
    void updateClient_dadosValidos_deveAtualizarCamposCorretamente() {
        Client existing = new Client();
        existing.setId(1);
        existing.setName("Joao");
        existing.setEmail("joao@email.com");
        existing.setPhone("11111111111");
        existing.setCpfCnpj("11111111111");
        existing.setClientType("PF");
        existing.setSecondaryPhone("11888887777");
        existing.setZipCode("01001000");
        existing.setStreet("Rua Antiga");
        existing.setNumber("10");
        existing.setComplement("Fundos");
        existing.setDistrict("Centro");
        existing.setCity("Sao Paulo");
        existing.setState("SP");
        existing.setNotes("Observacao original");
        existing.setStatus(true);

        ClientRequestDTO request = ClientRequestDTO.builder()
                .name("Joao")
                .email("joao@email.com")
                .phone("1234567890")
                .cpfCnpj("11111111111")
                .clientType("PF")
                .status(true)
                .build();

        when(clientRepository.findById(1)).thenReturn(Optional.of(existing));
        when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClientDetailsResponseDTO result = clientService.updateClient(1, request);

        assertThat(result.getName()).isEqualTo("Joao");
        assertThat(result.getPhone()).isEqualTo("1234567890");
        assertThat(result.getZipCode()).isEqualTo("01001000");
        assertThat(result.getStreet()).isEqualTo("Rua Antiga");
        assertThat(result.getNumber()).isEqualTo("10");
        assertThat(result.getComplement()).isEqualTo("Fundos");
        assertThat(result.getDistrict()).isEqualTo("Centro");
        assertThat(result.getNotes()).isEqualTo("Observacao original");
        assertThat(result.getStatus()).isTrue();
        verify(clientRepository).save(any(Client.class));
    }

    @Test
    @DisplayName("deleteClient deve delegar para o gerenciador de exclusao")
    void deleteClient_deveDelegarParaDeletionService() {
        clientService.deleteClient(1);

        verify(deletionService).delete(DeletionResource.CLIENT, 1);
    }
}
