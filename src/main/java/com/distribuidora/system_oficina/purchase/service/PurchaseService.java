package com.distribuidora.system_oficina.purchase.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import com.distribuidora.system_oficina.purchase.dto.PurchaseRequestDTO;
import com.distribuidora.system_oficina.purchase.dto.PurchaseResponseDTO;
import com.distribuidora.system_oficina.purchase.entity.Purchase;
import com.distribuidora.system_oficina.purchase.entity.Status;
import com.distribuidora.system_oficina.purchase.repository.PurchaseItemRepository;
import com.distribuidora.system_oficina.purchase.repository.PurchaseRepository;
import com.distribuidora.system_oficina.stock.dto.StockRequestDTO;
import com.distribuidora.system_oficina.stock.entity.Stock;
import com.distribuidora.system_oficina.stock.service.StockService;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class PurchaseService {
    
    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final SupplierRepository supplierRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final StockService stockSevice;
    
    private Purchase toEntity(Integer supplierId, Integer employeeId, PurchaseRequestDTO dto) {
        Purchase entity = new Purchase();
        Supplier supplier = supplierRepository.findById(supplierId).orElseThrow(() -> new RuntimeException("Supplier not found"));
        Employee employee = employeeRepository.findById(employeeId).orElseThrow(() -> new RuntimeException("Employee not found"));
        
        entity.setSupplier(supplier);
        entity.setEmployee(employee);
        entity.setNotes(dto.getNotes());
        entity.setStatus(Status.PENDENTE);
        entity.setTotal(BigDecimal.ZERO);
        return entity;
    }
    private PurchaseResponseDTO toResponseDTO(Purchase entity) {
        return PurchaseResponseDTO.fromEntity(entity);
    }
     public List<PurchaseResponseDTO> listPurchases(){
        return purchaseRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
     public PurchaseResponseDTO getPurchaseById(Integer id){
        return toResponseDTO(purchaseRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found")));
    }
    public PurchaseResponseDTO cancelPurchase(Integer id){
        Purchase purchase = purchaseRepository.findById(id).orElseThrow(() -> new RuntimeException("Purchase not found"));

        if(purchase.getStatus() == Status.RECEBIDA){
           throw new RuntimeException("nao pode cancelar, compra ja recebida");
        } 
            purchase.setStatus(Status.CANCELADA);
            return toResponseDTO(purchaseRepository.save(purchase));
    }
}
