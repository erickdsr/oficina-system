package com.distribuidora.system_oficina.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
    @DisplayName("")
    void shouldCreateClientCorrectly(){

    }
    @Test
    @DisplayName("")
    void shouldThrowExceptionWhenIdNotFound(){

    }
    @Test
    @DisplayName("")
    void shouldUpdateClientCorrectly(){

        int idUpdate = 1;

        ClientRequestDTO requestDto = new ClientRequestDTO();
        requestDto.setName("Pedro");
        requestDto.setEmail("Pedro@email.com");
        requestDto.setPhone("1234567890");
        requestDto.setCpfCnpj("12345678910");
        requestDto.setClientType("Individual");
        requestDto.setAddress("Rua Bom jardins");
        requestDto.setCity("Sao paulo");
        requestDto.setState("SP");
        requestDto.setStatus(true);

        Client oldClient = new Client();
        oldClient.setId(idUpdate);
        oldClient.setName("joao");
        oldClient.setEmail("joao@email.com");
        oldClient.setPhone("1234567890");
        oldClient.setCpfCnpj("2341234242");
        oldClient.setClientType("Individual");
        oldClient.setAddress("Avenida Dom Pedro");
        oldClient.setCity("Recife");
        oldClient.setState("PE");
        oldClient.setStatus(true);

        Client updatedClient = new Client();
        requestDto.setName("Pedro");
        requestDto.setEmail("Pedro@email.com");
        requestDto.setPhone("1234567890");
        requestDto.setCpfCnpj("12345678910");
        requestDto.setClientType("Individual");
        requestDto.setAddress("Rua Bom jardins");
        requestDto.setCity("Sao paulo");
        requestDto.setState("SP");
        requestDto.setStatus(true);

        when(clientRepository.findById(idUpdate))
            .thenReturn(Optional.of(oldClient));

        when(clientRepository.save(any(Client.class)))
            .thenReturn(updatedClient);

        ClientResponseDTO result = clientService.updateClient(idUpdate, requestDto);

        assertThat(result).isNotNull();

        verify(clientRepository).findById(idUpdate);
        verify(clientRepository).save(any(Client.class));
    }
    @Test
    @DisplayName("")
    void shouldDeleteCorrectly(){

        int idDelete = 1;

        when(clientRepository.existsById(idDelete))
            .thenReturn(true);
        
        clientService.deleteClient(idDelete);

        verify(clientRepository).existsById(idDelete);
        verify(clientRepository).deleteById(idDelete);

    }





}
