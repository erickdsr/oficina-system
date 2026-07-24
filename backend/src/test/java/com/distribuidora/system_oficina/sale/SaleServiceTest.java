package com.distribuidora.system_oficina.sale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
import com.distribuidora.system_oficina.sale.service.SaleService;
import com.distribuidora.system_oficina.stock.service.StockService;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private SaleItemRepository saleItemRepository;

    @Mock
    private SalePaymentsRepository salePaymentsRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private PaymentMethodRepository paymentMethodRepository;

    @Mock
    private StockService stockService;

    @InjectMocks
    private SaleService saleService;

    @Test
    @DisplayName("createSale com dados válidos deve criar a venda com status PENDENTE")
    void createSale_dadosValidos_deveCriarVendaComStatusPendente() {
        // Arrange
        Client client = new Client();
        client.setId(1);
        Employee employee = new Employee();
        employee.setId(2);
        Product product = new Product();
        product.setId(10);
        product.setSalePrice(new BigDecimal("10.00"));
        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setId(3);

        when(clientRepository.findById(1)).thenReturn(Optional.of(client));
        when(employeeRepository.findById(2)).thenReturn(Optional.of(employee));
        when(productRepository.findById(10)).thenReturn(Optional.of(product));
        when(paymentMethodRepository.findById(3)).thenReturn(Optional.of(paymentMethod));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaleRequestDTO request = SaleRequestDTO.builder()
                .clientId(1)
                .employeeId(2)
                .discount(new BigDecimal("2.00"))
                .notes("Venda teste")
                .items(List.of(SaleItemDTO.builder()
                        .productId(10)
                        .quantity(2)
                        .unitPrice(new BigDecimal("10.00"))
                        .discount(BigDecimal.ZERO)
                        .build()))
                .payments(List.of(SalePaymentDTO.builder()
                        .paymentMethodId(3)
                        .amount(new BigDecimal("18.00"))
                        .build()))
                .build();

        // Act
        SaleResponseDTO result = saleService.createSale(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(SaleStatus.PENDENTE);
        assertThat(result.getTotal()).isEqualByComparingTo("18.00");
        verify(saleItemRepository).save(any(SaleItem.class));
        verify(salePaymentsRepository).save(any(SalePayments.class));
    }

    @Test
    @DisplayName("createSale deve calcular o total corretamente")
    void createSale_deveCalcularTotalCorretamente() {
        // Arrange
        Client client = new Client();
        client.setId(1);
        Employee employee = new Employee();
        employee.setId(2);
        Product product = new Product();
        product.setId(10);
        product.setSalePrice(new BigDecimal("15.00"));
        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setId(3);

        when(clientRepository.findById(1)).thenReturn(Optional.of(client));
        when(employeeRepository.findById(2)).thenReturn(Optional.of(employee));
        when(productRepository.findById(10)).thenReturn(Optional.of(product));
        when(paymentMethodRepository.findById(3)).thenReturn(Optional.of(paymentMethod));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaleRequestDTO request = SaleRequestDTO.builder()
                .clientId(1)
                .employeeId(2)
                .discount(new BigDecimal("3.00"))
                .items(List.of(SaleItemDTO.builder()
                        .productId(10)
                        .quantity(2)
                        .unitPrice(new BigDecimal("15.00"))
                        .discount(BigDecimal.ZERO)
                        .build()))
                .payments(List.of(SalePaymentDTO.builder()
                        .paymentMethodId(3)
                        .amount(new BigDecimal("27.00"))
                        .build()))
                .build();

        // Act
        SaleResponseDTO result = saleService.createSale(request);

        // Assert
        assertThat(result.getTotal()).isEqualByComparingTo("27.00");
    }

    @Test
    @DisplayName("createSale com pagamento insuficiente deve lancar excecao")
    void createSale_pagamentoInsuficiente_deveLancarExcecao() {
        // Arrange
        Client client = new Client();
        client.setId(1);
        Employee employee = new Employee();
        employee.setId(2);
        Product product = new Product();
        product.setId(10);
        product.setSalePrice(new BigDecimal("15.00"));
        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setId(3);

        when(clientRepository.findById(1)).thenReturn(Optional.of(client));
        when(employeeRepository.findById(2)).thenReturn(Optional.of(employee));
        when(productRepository.findById(10)).thenReturn(Optional.of(product));
        when(paymentMethodRepository.findById(3)).thenReturn(Optional.of(paymentMethod));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaleRequestDTO request = SaleRequestDTO.builder()
                .clientId(1)
                .employeeId(2)
                .discount(BigDecimal.ZERO)
                .items(List.of(SaleItemDTO.builder()
                        .productId(10)
                        .quantity(2)
                        .unitPrice(new BigDecimal("15.00"))
                        .discount(BigDecimal.ZERO)
                        .build()))
                .payments(List.of(SalePaymentDTO.builder()
                        .paymentMethodId(3)
                        .amount(new BigDecimal("20.00"))
                        .build()))
                .build();

        // Act & Assert
        assertThrows(RuntimeException.class, () -> saleService.createSale(request));
    }

    @Test
    @DisplayName("createSale com cliente inexistente deve lancar excecao")
    void createSale_clienteNaoEncontrado_deveLancarExcecao() {
        // Arrange
        when(clientRepository.findById(1)).thenReturn(Optional.empty());

        SaleRequestDTO request = SaleRequestDTO.builder()
                .clientId(1)
                .employeeId(2)
                .items(List.of())
                .payments(List.of())
                .build();

        // Act & Assert
        assertThrows(RuntimeException.class, () -> saleService.createSale(request));
        verify(employeeRepository, never()).findById(any());
    }

    @Test
    @DisplayName("createSale com produto inexistente deve lançar exceção")
    void createSale_produtoNaoEncontrado_deveLancarExcecao() {
        // Arrange
        Client client = new Client();
        client.setId(1);
        Employee employee = new Employee();
        employee.setId(2);
        when(clientRepository.findById(1)).thenReturn(Optional.of(client));
        when(employeeRepository.findById(2)).thenReturn(Optional.of(employee));
        when(productRepository.findById(10)).thenReturn(Optional.empty());
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaleRequestDTO request = SaleRequestDTO.builder()
                .clientId(1)
                .employeeId(2)
                .items(List.of(SaleItemDTO.builder().productId(10).quantity(1).unitPrice(new BigDecimal("10.00")).build()))
                .payments(List.of())
                .build();

        // Act & Assert
        assertThrows(RuntimeException.class, () -> saleService.createSale(request));
    }

    @Test
    @DisplayName("finalizeSale deve chamar registerMovement para cada item da venda")
    void finalizeSale_deveCharmarRegisterMovementSaidaParaCadaItem() {
        // Arrange
        Sale sale = new Sale();
        sale.setId(1);
        sale.setStatus(SaleStatus.PENDENTE);
        Employee employee = new Employee();
        employee.setId(2);
        sale.setEmployee(employee);

        Product product = new Product();
        product.setId(10);

        SaleItem item1 = new SaleItem();
        item1.setProduct(product);
        item1.setQuantity(2);
        SaleItem item2 = new SaleItem();
        item2.setProduct(product);
        item2.setQuantity(1);
        sale.setItems(List.of(item1, item2));

        when(saleRepository.findById(1)).thenReturn(Optional.of(sale));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        saleService.finalizeSale(1);

        // Assert
        verify(stockService, times(2)).registerMovement(any(Product.class), any(Employee.class), any(), anyInt(), any(String.class));
    }

    @Test
    @DisplayName("finalizeSale deve alterar o status da venda para FINALIZADA")
    void finalizeSale_deveAlterarStatusParaFinalizada() {
        // Arrange
        Sale sale = new Sale();
        sale.setId(1);
        sale.setStatus(SaleStatus.PENDENTE);
        sale.setItems(List.of());
        when(saleRepository.findById(1)).thenReturn(Optional.of(sale));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        SaleResponseDTO result = saleService.finalizeSale(1);

        // Assert
        assertThat(result.getStatus()).isEqualTo(SaleStatus.FINALIZADA);
    }

    @Test
    @DisplayName("finalizeSale com status diferente de PENDENTE deve lançar exceção")
    void finalizeSale_statusNaoPendente_deveLancarExcecao() {
        // Arrange
        Sale sale = new Sale();
        sale.setStatus(SaleStatus.FINALIZADA);
        when(saleRepository.findById(1)).thenReturn(Optional.of(sale));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> saleService.finalizeSale(1));
        verify(stockService, never()).registerMovement(any(), any(), any(), anyInt(), any());
    }

    @Test
    @DisplayName("cancelSale com status FINALIZADA deve lançar exceção")
    void cancelSale_statusFinalizada_deveLancarExcecao() {
        // Arrange
        Sale sale = new Sale();
        sale.setStatus(SaleStatus.FINALIZADA);
        when(saleRepository.findById(1)).thenReturn(Optional.of(sale));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> saleService.cancelSale(1));
        verify(saleRepository, never()).save(any());
    }

    @Test
    @DisplayName("cancelSale deve alterar o status da venda para CANCELADA")
    void cancelSale_deveAlterarStatusParaCancelada() {
        // Arrange
        Sale sale = new Sale();
        sale.setStatus(SaleStatus.PENDENTE);
        when(saleRepository.findById(1)).thenReturn(Optional.of(sale));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        SaleResponseDTO result = saleService.cancelSale(1);

        // Assert
        assertThat(result.getStatus()).isEqualTo(SaleStatus.CANCELADA);
    }
}
