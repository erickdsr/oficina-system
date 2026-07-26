package com.distribuidora.system_oficina.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.distribuidora.system_oficina.client.dto.ClientRequestDTO;
import com.distribuidora.system_oficina.client.dto.ClientResponseDTO;
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
                .status(true)
                .build();

        Client savedClient = new Client();
        savedClient.setId(1);
        savedClient.setName("Maria");
        savedClient.setCpfCnpj("12345678900");
        savedClient.setEmail("maria@email.com");

        when(clientRepository.save(any(Client.class))).thenReturn(savedClient);

        ClientResponseDTO result = clientService.createClient(request);

        assertThat(result.getName()).isEqualTo("Maria");
        assertThat(result.getCpfCnpj()).isEqualTo("12345678900");
        verify(clientRepository).save(any(Client.class));
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
        existing.setStatus(true);

        ClientRequestDTO request = ClientRequestDTO.builder()
                .name("Pedro")
                .email("pedro@email.com")
                .phone("1234567890")
                .cpfCnpj("12345678910")
                .clientType("PF")
                .status(false)
                .build();

        when(clientRepository.findById(1)).thenReturn(Optional.of(existing));
        when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClientResponseDTO result = clientService.updateClient(1, request);

        assertThat(result.getName()).isEqualTo("Pedro");
        assertThat(result.getStatus()).isFalse();
        verify(clientRepository).save(any(Client.class));
    }

    @Test
    @DisplayName("deleteClient deve delegar para o gerenciador de exclusao")
    void deleteClient_deveDelegarParaDeletionService() {
        clientService.deleteClient(1);

        verify(deletionService).delete(DeletionResource.CLIENT, 1);
    }
}
