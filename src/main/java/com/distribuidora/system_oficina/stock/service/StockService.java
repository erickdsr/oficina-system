package com.distribuidora.system_oficina.stock.service;

import java.lang.classfile.instruction.SwitchCase;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import com.distribuidora.system_oficina.stock.dto.StockMovementDTO;
import com.distribuidora.system_oficina.stock.dto.StockRequestDTO;
import com.distribuidora.system_oficina.stock.dto.StockResponseDTO;
import com.distribuidora.system_oficina.stock.entity.Stock;
import com.distribuidora.system_oficina.stock.entity.StockMovement;
import com.distribuidora.system_oficina.stock.entity.StockMovementType;
import com.distribuidora.system_oficina.stock.repository.StockMovementRepository;
import com.distribuidora.system_oficina.stock.repository.StockRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StockService {
    
    private final StockRepository stockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
     private Stock toEntity(StockRequestDTO dto) {
        Stock entity = new Stock();
        updateEntityFromDto(entity, dto);
        return entity;
    }
    private void updateEntityFromDto(Stock entity, StockRequestDTO dto) {
        Product product = productRepository.findById(dto.getProductId()).orElseThrow(() -> new RuntimeException("Product not found"));
        entity.setProduct(product);
        entity.setQuantity(dto.getQuantity());
        entity.setMinQuantity(dto.getMinQuantity());
        entity.setLocation(dto.getLocation());
    }
    private StockResponseDTO toResponseDTO(Stock entity) {
        return StockResponseDTO.fromEntity(entity);
    }
    private StockMovementDTO toMovementDTO(StockMovement entity) {
        return StockMovementDTO.fromEntity(entity);
    }
    public List<StockResponseDTO> listStock(){
        return stockRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public StockResponseDTO getStockById(Integer id){
        return toResponseDTO(stockRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found")));
    }
    public List<StockResponseDTO> listLowStock(){
        return stockRepository.findAll().stream()
                .filter(stock -> stock.getQuantity() < stock.getMinQuantity())
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public StockResponseDTO updateStock(Integer id, StockRequestDTO dto){
        Stock entity = stockRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found"));
        
        updateEntityFromDto(entity, dto);
        
        return toResponseDTO(stockRepository.save(entity));
    }
    public List<StockMovementDTO> listMovementStock(){
        return stockMovementRepository.findAll().stream()
                .map(this::toMovementDTO)
                .collect(Collectors.toList());
    }
    public List<StockMovementDTO> listMovementProduct(Integer productId){
        return stockMovementRepository.findByProductId(productId).stream()
                .map(this::toMovementDTO)
                .collect(Collectors.toList());
    }
    private void registerMovement(Product product, Employee employee, StockMovementType type, Integer quantity, String reason){
        Stock stock = stockRepository.findByProduct(product).orElseThrow(() -> new RuntimeException("Stock not found"));
        if(type == StockMovementType.ENTRADA){
            stock.setQuantity(stock.getQuantity() + quantity);
            stockRepository.save(stock);
        }
    }
}
