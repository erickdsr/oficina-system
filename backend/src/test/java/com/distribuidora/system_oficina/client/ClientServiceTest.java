package com.distribuidora.system_oficina.client;

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

import com.distribuidora.system_oficina.client.dto.ClientRequestDTO;
import com.distribuidora.system_oficina.client.dto.ClientResponseDTO;
import com.distribuidora.system_oficina.client.entity.Client;
import com.distribuidora.system_oficina.client.repository.ClientRepository;
import com.distribuidora.system_oficina.client.service.ClientService;

@ExtendWith(MockitoExtension.class)
class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private ClientService clientService;

    @Test
    @DisplayName("createClient com dados válidos deve criar o cliente corretamente")
    void createClient_dadosValidos_deveCriarClienteCorretamente() {
        // Arrange
        ClientRequestDTO request = ClientRequestDTO.builder()
                .name("Maria")
                .cpfCnpj("12345678900")
                .email("maria@email.com")
                .clientType("PF")
                .phone("11999999999")
                .address("Rua A")
                .city("São Paulo")
                .state("SP")
                .status(true)
                .build();

        Client savedClient = new Client();
        savedClient.setId(1);
        savedClient.setName("Maria");
        savedClient.setCpfCnpj("12345678900");
        savedClient.setEmail("maria@email.com");

        when(clientRepository.save(any(Client.class))).thenReturn(savedClient);

        // Act
        ClientResponseDTO result = clientService.createClient(request);

        // Assert
        assertThat(result.getName()).isEqualTo("Maria");
        assertThat(result.getCpfCnpj()).isEqualTo("12345678900");
        verify(clientRepository).save(any(Client.class));
    }

    @Test
    @DisplayName("getClientById com id inexistente deve lançar exceção")
    void getClientById_idNaoExistente_deveLancarExcecao() {
        // Arrange
        when(clientRepository.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> clientService.getClientById(99));
    }

    @Test
    @DisplayName("updateClient com dados válidos deve atualizar os campos corretamente")
    void updateClient_dadosValidos_deveAtualizarCamposCorretamente() {
        // Arrange
        Client existing = new Client();
        existing.setId(1);
        existing.setName("João");
        existing.setEmail("joao@email.com");
        existing.setPhone("11111111111");
        existing.setCpfCnpj("11111111111");
        existing.setClientType("PF");
        existing.setAddress("Rua antiga");
        existing.setCity("Recife");
        existing.setState("PE");
        existing.setStatus(true);

        ClientRequestDTO request = ClientRequestDTO.builder()
                .name("Pedro")
                .email("pedro@email.com")
                .phone("1234567890")
                .cpfCnpj("12345678910")
                .clientType("PF")
                .address("Rua nova")
                .city("São Paulo")
                .state("SP")
                .status(false)
                .build();

        when(clientRepository.findById(1)).thenReturn(Optional.of(existing));
        when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ClientResponseDTO result = clientService.updateClient(1, request);

        // Assert
        assertThat(result.getName()).isEqualTo("Pedro");
        assertThat(result.getEmail()).isEqualTo("pedro@email.com");
        assertThat(result.getStatus()).isFalse();
        verify(clientRepository).save(any(Client.class));
    }

    @Test
    @DisplayName("deleteClient com id válido deve deletar corretamente")
    void deleteClient_idValido_deveDeletarCorretamente() {
        // Arrange
        when(clientRepository.existsById(1)).thenReturn(true);

        // Act
        clientService.deleteClient(1);

        // Assert
        verify(clientRepository).existsById(1);
        verify(clientRepository).deleteById(1);
    }
}
