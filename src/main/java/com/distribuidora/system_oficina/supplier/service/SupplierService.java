package com.distribuidora.system_oficina.supplier.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
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
    public List<SupplierResponseDTO> listSupplier(){
        return supplierRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public SupplierResponseDTO getSupplierById(Integer id){
        return toResponseDTO(supplierRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found")));
    }
    public SupplierResponseDTO createSupplier(SupplierRequestDTO dto){
        Supplier supplier = toEntity(dto);
        return toResponseDTO(supplierRepository.save(supplier));
    }
    public SupplierResponseDTO updateSupplier(Integer id, SupplierRequestDTO dto){
        Supplier entity = supplierRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"));
            entity.setName(dto.getName());
            entity.setCnpj(dto.getCnpj());
            entity.setEmail(dto.getEmail());
            entity.setPhone(dto.getPhone());
            entity.setAddress(dto.getAddress());
            entity.setCity(dto.getCity());
            entity.setState(dto.getState());
        return toResponseDTO(supplierRepository.save(entity));
    }
    public void deleteSupplier(Integer id){
        if (!supplierRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found");
        }
        supplierRepository.deleteById(id);
    }
}
