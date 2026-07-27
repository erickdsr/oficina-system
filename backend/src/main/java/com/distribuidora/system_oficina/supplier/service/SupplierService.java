package com.distribuidora.system_oficina.supplier.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.distribuidora.system_oficina.deletion.DeletionReportDTO;
import com.distribuidora.system_oficina.deletion.DeletionResource;
import com.distribuidora.system_oficina.deletion.DeletionResultDTO;
import com.distribuidora.system_oficina.deletion.DeletionService;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;
import com.distribuidora.system_oficina.supplier.dto.SupplierRequestDTO;
import com.distribuidora.system_oficina.supplier.dto.SupplierResponseDTO;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.server.ResponseStatusException;

@RequiredArgsConstructor
@Service
public class SupplierService {
    
    private final SupplierRepository supplierRepository;
    private final DeletionService deletionService;

    private Supplier toEntity(SupplierRequestDTO dto) {
        Supplier entity = new Supplier();
        updateEntity(entity, dto);
        return entity;
    }
    private SupplierResponseDTO toResponseDTO(Supplier entity) {
        return SupplierResponseDTO.fromEntity(entity);
    }
    public List<SupplierResponseDTO> listSupplier(boolean includeInactive) {
        return (includeInactive ? supplierRepository.findAllByOrderByNameAsc() : supplierRepository.findByStatusOrderByNameAsc(true)).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public List<SupplierResponseDTO> listSupplier() {
        return listSupplier(false);
    }
    public SupplierResponseDTO getSupplierById(Integer id) {
        return toResponseDTO(supplierRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found with id: " + id)));
    }
    public SupplierResponseDTO createSupplier(SupplierRequestDTO dto) {
        Supplier supplier = toEntity(dto);
        return toResponseDTO(supplierRepository.save(supplier));
    }
    public SupplierResponseDTO updateSupplier(Integer id, SupplierRequestDTO dto) {
        Supplier entity = supplierRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found with id: " + id));
        updateEntity(entity, dto);
        return toResponseDTO(supplierRepository.save(entity));
    }
    @Transactional
    public DeletionResultDTO deleteSupplier(Integer id) {
        return deletionService.delete(DeletionResource.SUPPLIER, id);
    }

    @Transactional
    public DeletionResultDTO forceDeleteSupplier(Integer id) {
        return deletionService.forceDelete(DeletionResource.SUPPLIER, id);
    }

    public DeletionReportDTO getDeletionReport(Integer id) {
        return deletionService.report(DeletionResource.SUPPLIER, id);
    }

    private void updateEntity(Supplier entity, SupplierRequestDTO dto) {
        String tradeName = clean(dto.getTradeName());
        String displayName = clean(dto.getName());
        String state = clean(dto.getState());
        entity.setName(displayName != null ? displayName : tradeName);
        entity.setLegalName(clean(dto.getLegalName()));
        entity.setTradeName(tradeName);
        entity.setCnpj(onlyDigits(dto.getCnpj()));
        entity.setStateRegistration(clean(dto.getStateRegistration()));
        entity.setContactName(clean(dto.getContactName()));
        entity.setEmail(clean(dto.getEmail()));
        entity.setPhone(onlyDigits(dto.getPhone()));
        entity.setZipCode(onlyDigits(dto.getZipCode()));
        entity.setStreet(clean(dto.getStreet()));
        entity.setNumber(clean(dto.getNumber()));
        entity.setDistrict(clean(dto.getDistrict()));
        entity.setComplement(clean(dto.getComplement()));
        entity.setCity(clean(dto.getCity()));
        entity.setState(state != null ? state.toUpperCase() : null);
        entity.setAddress(resolveAddress(dto));
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
    }

    private String resolveAddress(SupplierRequestDTO dto) {
        if (clean(dto.getAddress()) != null) {
            return clean(dto.getAddress());
        }

        return "%s, %s - %s".formatted(clean(dto.getStreet()), clean(dto.getNumber()), clean(dto.getDistrict()));
    }

    private String onlyDigits(String value) {
        return value == null ? null : value.replaceAll("\\D", "");
    }

    private String clean(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
