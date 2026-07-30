package com.distribuidora.system_oficina.client.service;

import java.util.List;
import java.util.Locale;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import com.distribuidora.system_oficina.client.dto.ClientDetailsResponseDTO;
import com.distribuidora.system_oficina.client.dto.ClientCityFilterOptionDTO;
import com.distribuidora.system_oficina.client.dto.ClientListResponseDTO;
import com.distribuidora.system_oficina.client.dto.ClientSummaryResponseDTO;
import org.springframework.web.server.ResponseStatusException;
import com.distribuidora.system_oficina.client.dto.ClientRequestDTO;
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
        entity.setName(trim(dto.getName()));
        entity.setCpfCnpj(digits(dto.getCpfCnpj()));
        entity.setEmail(trim(dto.getEmail()));
        entity.setClientType(trim(dto.getClientType()));
        entity.setPhone(digits(dto.getPhone()));
        entity.setSecondaryPhone(digits(dto.getSecondaryPhone()));
        entity.setAddress(trim(dto.getAddress()));
        entity.setZipCode(digits(dto.getZipCode()));
        entity.setStreet(trim(dto.getStreet()));
        entity.setNumber(trim(dto.getNumber()));
        entity.setComplement(trim(dto.getComplement()));
        entity.setDistrict(trim(dto.getDistrict()));
        entity.setCity(trim(dto.getCity()));
        entity.setState(trim(dto.getState()));
        entity.setNotes(trim(dto.getNotes()));
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        return entity;
    }

    private ClientDetailsResponseDTO toDetailsResponseDTO(Client entity) {
        return ClientDetailsResponseDTO.fromEntity(entity);
    }

    private ClientListResponseDTO toListResponseDTO(Client entity) {
        return ClientListResponseDTO.fromEntity(entity);
    }

    public List<ClientListResponseDTO> listClients(boolean includeInactive) {
        return (includeInactive ? clientRepository.findAll() : clientRepository.findByStatus(true)).stream()
                .map(this::toListResponseDTO)
                .collect(Collectors.toList());
    }
    public List<ClientListResponseDTO> listClients() {
        return listClients(false);
    }

    public ClientSummaryResponseDTO getClientSummary() {
        long activeCount = clientRepository.countByStatus(true);
        long inactiveCount = clientRepository.countByStatus(false);
        return ClientSummaryResponseDTO.builder()
                .activeCount(activeCount)
                .inactiveCount(inactiveCount)
                .totalCount(activeCount + inactiveCount)
                .build();
    }

    public List<ClientCityFilterOptionDTO> listCityFilterOptions(String states, String statusFilter) {
        List<String> normalizedStates = !StringUtils.hasText(states) ? List.of() : Arrays.stream(states.split(","))
                .filter(StringUtils::hasText)
                .map(state -> state.trim().toUpperCase(Locale.ROOT))
                .distinct()
                .collect(Collectors.toList());
        Boolean status = switch (statusFilter == null ? "all" : statusFilter.trim().toLowerCase(Locale.ROOT)) {
            case "active" -> true;
            case "inactive" -> false;
            default -> null;
        };

        boolean statesEmpty = normalizedStates.isEmpty();
        List<String> queryStates = statesEmpty ? List.of("__NONE__") : normalizedStates;

        return clientRepository.findCityFilterOptions(queryStates, statesEmpty, status).stream()
                .map(option -> ClientCityFilterOptionDTO.builder()
                        .estado(option.getState())
                        .cidade(toDisplayCity(option.getCity()))
                        .quantidadeClientes(option.getClientCount())
                        .build())
                .collect(Collectors.toList());
    }

    public ClientDetailsResponseDTO getClientById(Integer id) {
        return toDetailsResponseDTO(clientRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found with id: " + id)));
    }
    public ClientDetailsResponseDTO createClient(ClientRequestDTO dto) {
        Client client = toEntity(dto);
        return toDetailsResponseDTO(clientRepository.save(client));
    }
    public ClientDetailsResponseDTO updateClient(Integer id, ClientRequestDTO dto) {
        Client entity = clientRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found with id: " + id));

        merge(dto.getName(), entity::setName);
        mergeDigits(dto.getCpfCnpj(), entity::setCpfCnpj);
        merge(dto.getClientType(), entity::setClientType);
        mergeNullable(dto.getEmail(), entity::setEmail);
        mergeDigits(dto.getPhone(), entity::setPhone);
        mergeDigits(dto.getSecondaryPhone(), entity::setSecondaryPhone);
        mergeNullable(dto.getAddress(), entity::setAddress);
        mergeDigits(dto.getZipCode(), entity::setZipCode);
        mergeNullable(dto.getStreet(), entity::setStreet);
        mergeNullable(dto.getNumber(), entity::setNumber);
        mergeNullable(dto.getComplement(), entity::setComplement);
        mergeNullable(dto.getDistrict(), entity::setDistrict);
        mergeNullable(dto.getCity(), entity::setCity);
        mergeNullable(dto.getState(), entity::setState);
        mergeNullable(dto.getNotes(), entity::setNotes);
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }

        return toDetailsResponseDTO(clientRepository.save(entity));
    }

    private void merge(String value, java.util.function.Consumer<String> setter) {
        if (StringUtils.hasText(value)) {
            setter.accept(value.trim());
        }
    }

    private void mergeNullable(String value, java.util.function.Consumer<String> setter) {
        if (value != null) {
            setter.accept(value.trim());
        }
    }

    private void mergeDigits(String value, java.util.function.Consumer<String> setter) {
        if (value != null) {
            setter.accept(digits(value));
        }
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String digits(String value) {
        return value == null ? null : value.replaceAll("\\D", "");
    }

    private String toDisplayCity(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String[] words = value.trim().toLowerCase(Locale.forLanguageTag("pt-BR")).split("\\s+");
        return java.util.Arrays.stream(words)
                .map(word -> word.length() <= 2 ? word : word.substring(0, 1).toUpperCase(Locale.forLanguageTag("pt-BR")) + word.substring(1))
                .collect(Collectors.joining(" "));
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
