package com.distribuidora.system_oficina.sale.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.client.entity.Client;
import com.distribuidora.system_oficina.client.repository.ClientRepository;
import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.paymentMethod.entity.PaymentMethod;
import com.distribuidora.system_oficina.paymentMethod.repository.PaymentMethodRepository;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.entity.Unit;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import com.distribuidora.system_oficina.purchase.entity.Status;
import com.distribuidora.system_oficina.role.entity.Role;
import com.distribuidora.system_oficina.role.repository.RoleRepository;
import com.distribuidora.system_oficina.sale.dto.SaleItemDTO;
import com.distribuidora.system_oficina.sale.dto.SalePaymentDTO;
import com.distribuidora.system_oficina.sale.dto.SaleRequestDTO;
import com.distribuidora.system_oficina.sale.dto.SaleResponseDTO;
import com.distribuidora.system_oficina.stock.entity.Stock;
import com.distribuidora.system_oficina.stock.repository.StockRepository;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SaleServiceIntegrationTest {

    @Autowired
    private SaleService saleService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Autowired
    private StockRepository stockRepository;

    @BeforeEach
    void setUp() {
        Role role = new Role();
        role.setName("ADMIN");
        role.setDescription("Administrator");
        roleRepository.saveAndFlush(role);

        Client client = new Client();
        client.setName("Maria");
        client.setEmail("maria@example.com");
        client.setPhone("11999999999");
        client.setCpfCnpj("12345678901");
        client.setClientType("PF");
        client.setAddress("Rua A");
        client.setCity("São Paulo");
        client.setState("SP");
        client.setStatus(true);
        clientRepository.saveAndFlush(client);

        Employee employee = new Employee();
        employee.setName("João");
        employee.setCpf("11111111111");
        employee.setEmail("joao@example.com");
        employee.setPassword(passwordEncoder.encode("123456"));
        employee.setPhone("11888888888");
        employee.setRole(role);
        employee.setStatus(true);
        employeeRepository.saveAndFlush(employee);

        Category category = new Category();
        category.setName("Peças");
        category.setDescription("Peças automotivas");
        categoryRepository.saveAndFlush(category);

        Supplier supplier = new Supplier();
        supplier.setName("Fornecedor A");
        supplier.setCnpj("12345678000199");
        supplier.setEmail("fornecedor@example.com");
        supplier.setPhone("11333333333");
        supplier.setAddress("Rua B");
        supplier.setCity("São Paulo");
        supplier.setState("SP");
        supplier.setStatus(true);
        supplierRepository.saveAndFlush(supplier);

        Product product = new Product();
        product.setName("Filtro de Óleo");
        product.setDescription("Filtro de óleo automotivo");
        product.setBarCode("ABC123");
        product.setPartNumber("PN-001");
        product.setSupplier(supplier);
        product.setCategory(category);
        product.setUnit(Unit.UN);
        product.setCostPrice(new BigDecimal("10.00"));
        product.setSalePrice(new BigDecimal("25.00"));
        product.setStatus(true);
        productRepository.saveAndFlush(product);

        Stock stock = new Stock();
        stock.setProduct(product);
        stock.setQuantity(10);
        stock.setMinQuantity(2);
        stock.setLocation("A1");
        stockRepository.saveAndFlush(stock);

        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setName("Dinheiro");
        paymentMethodRepository.saveAndFlush(paymentMethod);
    }

    @Test
    void shouldCreateAndFinalizeSaleSuccessfully() {
        Client client = clientRepository.findAll().get(0);
        Employee employee = employeeRepository.findAll().get(0);
        Product product = productRepository.findAll().get(0);
        PaymentMethod paymentMethod = paymentMethodRepository.findAll().get(0);

        SaleRequestDTO request = SaleRequestDTO.builder()
                .clientId(client.getId())
                .employeeId(employee.getId())
                .discount(new BigDecimal("2.00"))
                .notes("Venda de teste")
                .items(List.of(SaleItemDTO.builder()
                        .productId(product.getId())
                        .quantity(2)
                        .unitPrice(new BigDecimal("25.00"))
                        .discount(new BigDecimal("0.00"))
                        .subtotal(new BigDecimal("50.00"))
                        .build()))
                .payments(List.of(SalePaymentDTO.builder()
                        .paymentMethodId(paymentMethod.getId())
                        .amount(new BigDecimal("48.00"))
                        .build()))
                .build();

        SaleResponseDTO createdSale = saleService.createSale(request);

        assertThat(createdSale.getStatus()).isEqualTo(Status.PENDENTE);
        assertThat(createdSale.getTotal()).isEqualByComparingTo("48.00");

        SaleResponseDTO finalizedSale = saleService.finalizeSale(createdSale.getId());

        assertThat(finalizedSale.getStatus()).isEqualTo(Status.RECEBIDA);

        Stock updatedStock = stockRepository.findByProductId(product.getId()).orElseThrow();
        assertThat(updatedStock.getQuantity()).isEqualTo(8);
    }

    @Test
    void shouldRejectSaleWhenStockIsInsufficient() {
        Client client = clientRepository.findAll().get(0);
        Employee employee = employeeRepository.findAll().get(0);
        Product product = productRepository.findAll().get(0);
        PaymentMethod paymentMethod = paymentMethodRepository.findAll().get(0);

        SaleRequestDTO request = SaleRequestDTO.builder()
                .clientId(client.getId())
                .employeeId(employee.getId())
                .discount(BigDecimal.ZERO)
                .notes("Venda sem estoque")
                .items(List.of(SaleItemDTO.builder()
                        .productId(product.getId())
                        .quantity(20)
                        .unitPrice(new BigDecimal("25.00"))
                        .discount(BigDecimal.ZERO)
                        .subtotal(new BigDecimal("500.00"))
                        .build()))
                .payments(List.of(SalePaymentDTO.builder()
                        .paymentMethodId(paymentMethod.getId())
                        .amount(new BigDecimal("500.00"))
                        .build()))
                .build();

        SaleResponseDTO createdSale = saleService.createSale(request);

        assertThatThrownBy(() -> saleService.finalizeSale(createdSale.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Estoque insuficiente");
    }
}
