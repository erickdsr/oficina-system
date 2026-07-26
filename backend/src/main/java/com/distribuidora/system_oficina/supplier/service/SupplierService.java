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
        entity.setName(dto.getName());
        entity.setCnpj(dto.getCnpj());
        entity.setEmail(dto.getEmail());
        entity.setPhone(dto.getPhone());
        entity.setAddress(dto.getAddress());
        entity.setCity(dto.getCity());
        entity.setState(dto.getState());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        return entity;
    }
    private SupplierResponseDTO toResponseDTO(Supplier entity) {
        return SupplierResponseDTO.fromEntity(entity);
    }
    public List<SupplierResponseDTO> listSupplier(boolean includeInactive) {
        return (includeInactive ? supplierRepository.findAll() : supplierRepository.findByStatus(true)).stream()
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
        entity.setName(dto.getName());
        entity.setCnpj(dto.getCnpj());
        entity.setEmail(dto.getEmail());
        entity.setPhone(dto.getPhone());
        entity.setAddress(dto.getAddress());
        entity.setCity(dto.getCity());
        entity.setState(dto.getState());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
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
}
