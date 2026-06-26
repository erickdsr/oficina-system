package com.distribuidora.system_oficina.sale.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.distribuidora.system_oficina.client.entity.Client;
import com.distribuidora.system_oficina.client.repository.ClientRepository;
import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.paymentMethod.entity.PaymentMethod;
import com.distribuidora.system_oficina.paymentMethod.repository.PaymentMethodRepository;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import com.distribuidora.system_oficina.purchase.entity.Status;
import com.distribuidora.system_oficina.sale.dto.SaleItemDTO;
import com.distribuidora.system_oficina.sale.dto.SalePaymentDTO;
import com.distribuidora.system_oficina.sale.dto.SaleRequestDTO;
import com.distribuidora.system_oficina.sale.dto.SaleResponseDTO;
import com.distribuidora.system_oficina.sale.entity.Sale;
import com.distribuidora.system_oficina.sale.entity.SaleItem;
import com.distribuidora.system_oficina.sale.entity.SalePayments;
import com.distribuidora.system_oficina.sale.repository.SaleItemRepository;
import com.distribuidora.system_oficina.sale.repository.SalePaymentsRepository;
import com.distribuidora.system_oficina.sale.repository.SaleRepository;
import com.distribuidora.system_oficina.stock.entity.StockMovementType;
import com.distribuidora.system_oficina.stock.service.StockService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class SaleService {
    
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final SalePaymentsRepository salePaymentsRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final StockService stockService;

   private Sale toEntity(SaleRequestDTO dto) {

    Client client = clientRepository.findById(dto.getClientId())
            .orElseThrow(() -> new RuntimeException("Client not found"));

    Employee employee = employeeRepository.findById(dto.getEmployeeId())
            .orElseThrow(() -> new RuntimeException("Employee not found"));

    Sale sale = new Sale();
    sale.setClient(client);
    sale.setEmployee(employee);
    sale.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : BigDecimal.ZERO);
    sale.setNotes(dto.getNotes());
    sale.setStatus(Status.PENDENTE);
    sale.setTotal(BigDecimal.ZERO);

    return sale;
}

    private SaleResponseDTO toResponseDTO(Sale entity){
        return SaleResponseDTO.fromEntity(entity);
    }
    private SaleItemDTO toItemDTO(SaleItem item){
        return SaleItemDTO.fromEntity(item);
    }
    private SalePaymentDTO toPaymentDTO(SalePayments payment){
        return SalePaymentDTO.fromEntity(payment);
    }
    @Transactional
    public SaleResponseDTO createSale(SaleRequestDTO dto) {

    Client client = clientRepository.findById(dto.getClientId())
        .orElseThrow(() -> new RuntimeException("Client not found"));

    Employee employee = employeeRepository.findById(dto.getEmployeeId())
        .orElseThrow(() -> new RuntimeException("Employee not found"));

    Sale sale = new Sale();
    sale.setClient(client);
    sale.setEmployee(employee);
    sale.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : BigDecimal.ZERO);
    sale.setNotes(dto.getNotes());
    sale.setStatus(Status.PENDENTE);
    sale.setTotal(BigDecimal.ZERO);

    Sale savedSale = saleRepository.save(sale);

    BigDecimal total = BigDecimal.ZERO;

    for (SaleItemDTO itemDTO : dto.getItems()) {

        Product product = productRepository.findById(itemDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        BigDecimal discount = itemDTO.getDiscount() != null ? itemDTO.getDiscount() : BigDecimal.ZERO;
        BigDecimal subtotal = product.getSalePrice()
                .multiply(BigDecimal.valueOf(itemDTO.getQuantity()))
                .subtract(discount);

        SaleItem item = new SaleItem();
        item.setSale(savedSale);
        item.setProduct(product);
        item.setQuantity(itemDTO.getQuantity());
        item.setUnitPrice(product.getSalePrice());
        item.setDiscount(discount);
        item.setSubtotal(subtotal);

        saleItemRepository.save(item);

        total = total.add(subtotal);
    }

    for (SalePaymentDTO paymentDTO : dto.getPayments()) {

        PaymentMethod paymentMethod = paymentMethodRepository.findById(paymentDTO.getPaymentMethodId())
                .orElseThrow(() -> new RuntimeException("PaymentMethod not found"));

        SalePayments payment = new SalePayments();
        payment.setSale(savedSale);
        payment.setPaymentMethodId(paymentMethod);
        payment.setAmount(paymentDTO.getAmount());

        salePaymentsRepository.save(payment);
    }

    BigDecimal totalFinal = total.subtract(savedSale.getDiscount());
    savedSale.setTotal(totalFinal);
    saleRepository.save(savedSale);

    return toResponseDTO(savedSale);
}
    public List<SaleResponseDTO> listSales(){
        return saleRepository.findAll().stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }
    public SaleResponseDTO getSaleById(Integer id){
        return toResponseDTO(saleRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found")));

    }
    @Transactional
    public SaleResponseDTO finalizeSale(Integer id){
        Sale sale = saleRepository.findById(id).orElseThrow(() -> new RuntimeException("Sale not found"));

        if(sale.getStatus() != Status.PENDENTE){
            throw new RuntimeException("nao pode finalizar, compra ja recebido ou cancelado");
        }
            for (SaleItem item : sale.getItems()) {
                stockService.registerMovement(
                item.getProduct(),
                sale.getEmployee(),
                StockMovementType.SAIDA,
                item.getQuantity(),
                 "Venda #" + sale.getId()
                );
           }
           sale.setStatus(Status.RECEBIDA);
           return toResponseDTO(saleRepository.save(sale));
    }    
    public SaleResponseDTO cancelSale(Integer id){
        Sale sale = saleRepository.findById(id).orElseThrow(() -> new RuntimeException("Sale not found"));

        if(sale.getStatus() == Status.RECEBIDA){
            throw new RuntimeException("nao pode cancelar, compra ja recebida");
        }
        else if (sale.getStatus() == Status.CANCELADA){
            throw new RuntimeException("nao pode cancelar, compra ja cancelada");
        }
        sale.setStatus(Status.CANCELADA);
        return toResponseDTO(saleRepository.save(sale));

    }

}
