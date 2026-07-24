package com.distribuidora.system_oficina.sale.service;

import java.math.BigDecimal;
import java.util.ArrayList;
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
import com.distribuidora.system_oficina.sale.dto.SaleItemDTO;
import com.distribuidora.system_oficina.sale.dto.SalePaymentDTO;
import com.distribuidora.system_oficina.sale.dto.SaleRequestDTO;
import com.distribuidora.system_oficina.sale.dto.SaleResponseDTO;
import com.distribuidora.system_oficina.sale.entity.Sale;
import com.distribuidora.system_oficina.sale.entity.SaleItem;
import com.distribuidora.system_oficina.sale.entity.SalePayments;
import com.distribuidora.system_oficina.sale.entity.SaleStatus;
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
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Client not found with id: " + dto.getClientId()));
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Employee not found with id: " + dto.getEmployeeId()));

        Sale sale = new Sale();
        sale.setClient(client);
        sale.setEmployee(employee);
        sale.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : BigDecimal.ZERO);
        sale.setNotes(dto.getNotes());
        sale.setStatus(SaleStatus.PENDENTE);
        sale.setTotal(BigDecimal.ZERO);
        sale.setItems(new ArrayList<>());
        sale.setPayments(new ArrayList<>());
        return sale;
    }

    private SaleResponseDTO toResponseDTO(Sale entity) {
        return SaleResponseDTO.fromEntity(entity);
    }

    @Transactional
    public SaleResponseDTO createSale(SaleRequestDTO dto) {
        Sale savedSale = saleRepository.save(toEntity(dto));

        List<SaleItem> saleItems = new ArrayList<>();
        List<SalePayments> salePayments = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (SaleItemDTO itemDTO : dto.getItems()) {
            Product product = productRepository.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Product not found with id: " + itemDTO.getProductId()));

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

            saleItems.add(item);
            saleItemRepository.save(item);
            total = total.add(subtotal);
        }

        for (SalePaymentDTO paymentDTO : dto.getPayments()) {
            PaymentMethod paymentMethod = paymentMethodRepository.findById(paymentDTO.getPaymentMethodId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Payment method not found with id: " + paymentDTO.getPaymentMethodId()));

            SalePayments payment = new SalePayments();
            payment.setSale(savedSale);
            payment.setPaymentMethod(paymentMethod);
            payment.setAmount(paymentDTO.getAmount());

            salePayments.add(payment);
            salePaymentsRepository.save(payment);
        }

        savedSale.setItems(saleItems);
        savedSale.setPayments(salePayments);
        BigDecimal finalTotal = total.subtract(savedSale.getDiscount());
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sale discount cannot exceed item total");
        }

        BigDecimal paidTotal = salePayments.stream()
                .map(SalePayments::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (paidTotal.compareTo(finalTotal) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payments do not cover sale total");
        }

        savedSale.setTotal(finalTotal);
        return toResponseDTO(saleRepository.save(savedSale));
    }

    @Transactional(readOnly = true)
    public List<SaleResponseDTO> listSales() {
        return saleRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SaleResponseDTO getSaleById(Integer id) {
        return toResponseDTO(saleRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found with id: " + id)));
    }

    @Transactional
    public SaleResponseDTO finalizeSale(Integer id) {
        Sale sale = saleRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found with id: " + id));

        if (sale.getStatus() != SaleStatus.PENDENTE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Cannot finalize sale that is not pending with id: " + id);
        }

        if (sale.getItems() != null) {
            for (SaleItem item : sale.getItems()) {
                stockService.registerMovement(
                        item.getProduct(),
                        sale.getEmployee(),
                        StockMovementType.SAIDA,
                        item.getQuantity(),
                        "Venda #" + sale.getId());
            }
        }

        sale.setStatus(SaleStatus.FINALIZADA);
        return toResponseDTO(saleRepository.save(sale));
    }

    @Transactional
    public SaleResponseDTO cancelSale(Integer id) {
        Sale sale = saleRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found with id: " + id));

        if (sale.getStatus() == SaleStatus.FINALIZADA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel finalized sale with id: " + id);
        }
        if (sale.getStatus() == SaleStatus.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sale already canceled with id: " + id);
        }

        sale.setStatus(SaleStatus.CANCELADA);
        return toResponseDTO(saleRepository.save(sale));
    }
}
