package com.distribuidora.system_oficina.client.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.distribuidora.system_oficina.client.dto.ClientRequestDTO;
import com.distribuidora.system_oficina.client.dto.ClientResponseDTO;
import com.distribuidora.system_oficina.client.repository.ClientRepository;
import com.distribuidora.system_oficina.client.entity.Client;
import com.distribuidora.system_oficina.deletion.DeletionReportDTO;
import com.distribuidora.system_oficina.deletion.DeletionResource;
import com.distribuidora.system_oficina.deletion.DeletionResultDTO;
import com.distribuidora.system_oficina.deletion.DeletionService;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final DeletionService deletionService;

    private Client toEntity(ClientRequestDTO dto) {
        Client entity = new Client();
        entity.setName(dto.getName());
        entity.setCpfCnpj(dto.getCpfCnpj());
        entity.setEmail(dto.getEmail());
        entity.setClientType(dto.getClientType());
        entity.setPhone(dto.getPhone());
        entity.setAddress(dto.getAddress());
        entity.setCity(dto.getCity());
        entity.setState(dto.getState());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        return entity;
    }
    private ClientResponseDTO toResponseDTO(Client entity) {
        return ClientResponseDTO.fromEntity(entity);
    }
    public List<ClientResponseDTO> listClients(boolean includeInactive) {
        return (includeInactive ? clientRepository.findAll() : clientRepository.findByStatus(true)).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public List<ClientResponseDTO> listClients() {
        return listClients(false);
    }
    public ClientResponseDTO getClientById(Integer id) {
        return toResponseDTO(clientRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found with id: " + id)));
    }
    public ClientResponseDTO createClient(ClientRequestDTO dto) {
        Client client = toEntity(dto);
        return toResponseDTO(clientRepository.save(client));
    }
    public ClientResponseDTO updateClient(Integer id, ClientRequestDTO dto) {
        Client entity = clientRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found with id: " + id));
        entity.setName(dto.getName());
        entity.setCpfCnpj(dto.getCpfCnpj());
        entity.setClientType(dto.getClientType());
        entity.setEmail(dto.getEmail());
        entity.setPhone(dto.getPhone());
        entity.setAddress(dto.getAddress());
        entity.setCity(dto.getCity());
        entity.setState(dto.getState());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        return toResponseDTO(clientRepository.save(entity));
    }
    @Transactional
    public DeletionResultDTO deleteClient(Integer id) {
        return deletionService.delete(DeletionResource.CLIENT, id);
    }

    @Transactional
    public DeletionResultDTO forceDeleteClient(Integer id) {
        return deletionService.forceDelete(DeletionResource.CLIENT, id);
    }

    public DeletionReportDTO getDeletionReport(Integer id) {
        return deletionService.report(DeletionResource.CLIENT, id);
    }
}
