package com.distribuidora.system_oficina.sale;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
import com.distribuidora.system_oficina.role.entity.Role;
import com.distribuidora.system_oficina.role.repository.RoleRepository;
import com.distribuidora.system_oficina.sale.dto.SaleItemDTO;
import com.distribuidora.system_oficina.sale.dto.SalePaymentDTO;
import com.distribuidora.system_oficina.sale.dto.SaleRequestDTO;
import com.distribuidora.system_oficina.sale.dto.SaleResponseDTO;
import com.distribuidora.system_oficina.sale.entity.SaleStatus;
import com.distribuidora.system_oficina.sale.repository.SaleRepository;
import com.distribuidora.system_oficina.sale.service.SaleService;
import com.distribuidora.system_oficina.stock.entity.Stock;
import com.distribuidora.system_oficina.stock.entity.StockMovementType;
import com.distribuidora.system_oficina.stock.repository.StockMovementRepository;
import com.distribuidora.system_oficina.stock.repository.StockRepository;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SalePersistenceIntegrationTest {

    @Autowired
    private SaleService saleService;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Test
    @DisplayName("createSale deve persistir venda, itens, pagamentos e gerar movimentacao ao finalizar")
    void createSale_devePersistirVendaItensPagamentosEMovimentacaoAoFinalizar() {
        TestData data = createTestData();

        SaleRequestDTO firstRequest = saleRequest(data.client.getId(), data.employee.getId(), data.product.getId(), data.paymentMethod.getId(), 2);
        SaleRequestDTO secondRequest = saleRequest(data.client.getId(), data.employee.getId(), data.product.getId(), data.paymentMethod.getId(), 1);
        SaleRequestDTO thirdRequest = saleRequest(data.client.getId(), data.employee.getId(), data.product.getId(), data.paymentMethod.getId(), 3);

        SaleResponseDTO firstSale = saleService.createSale(firstRequest);
        SaleResponseDTO secondSale = saleService.createSale(secondRequest);
        SaleResponseDTO thirdSale = saleService.createSale(thirdRequest);

        entityManager.flush();
        entityManager.clear();

        assertThat(saleRepository.findById(firstSale.getId())).isPresent();
        assertThat(saleService.listSales())
                .extracting(SaleResponseDTO::getId)
                .contains(firstSale.getId(), secondSale.getId(), thirdSale.getId());

        SaleResponseDTO persistedSale = saleService.getSaleById(firstSale.getId());
        assertThat(persistedSale.getItems()).hasSize(1);
        assertThat(persistedSale.getPayments()).hasSize(1);
        assertThat(persistedSale.getStatus()).isEqualTo(SaleStatus.PENDENTE);

        saleService.finalizeSale(firstSale.getId());
        entityManager.flush();
        entityManager.clear();

        Stock updatedStock = stockRepository.findByProductId(data.product.getId()).orElseThrow();
        assertThat(updatedStock.getQuantity()).isEqualTo(8);

        assertThat(stockMovementRepository.findByProductId(data.product.getId()))
                .anySatisfy(movement -> {
                    assertThat(movement.getType()).isEqualTo(StockMovementType.SAIDA);
                    assertThat(movement.getQuantity()).isEqualTo(2);
                    assertThat(movement.getReason()).isEqualTo("Venda #" + firstSale.getId());
                    assertThat(movement.getPreviousBalance()).isEqualTo(10);
                    assertThat(movement.getCurrentBalance()).isEqualTo(8);
                });
    }

    private TestData createTestData() {
        Role role = new Role();
        role.setName("SALESPERSON");
        role.setDescription("Vendedor");
        role.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        role = roleRepository.save(role);

        Employee employee = new Employee();
        employee.setName("Vendedor Teste");
        employee.setCpf("12345678901");
        employee.setEmail("vendedor.persistencia@test.local");
        employee.setPassword("secret");
        employee.setPhone("11999999999");
        employee.setRole(role);
        employee = employeeRepository.save(employee);

        Client client = new Client();
        client.setName("Cliente Teste");
        client.setEmail("cliente.persistencia@test.local");
        client.setPhone("11988888888");
        client.setCpfCnpj("12345678909");
        client.setClientType("PF");
        client = clientRepository.save(client);

        Category category = new Category();
        category.setName("Categoria Teste Vendas");
        category = categoryRepository.save(category);

        Product product = new Product();
        product.setName("Produto Teste Vendas");
        product.setCategory(category);
        product.setUnit(Unit.UN);
        product.setCostPrice(new BigDecimal("5.00"));
        product.setSalePrice(new BigDecimal("10.00"));
        product.setStatus(true);
        product = productRepository.save(product);

        Stock stock = new Stock();
        stock.setProduct(product);
        stock.setQuantity(10);
        stock.setMinQuantity(1);
        stock = stockRepository.save(stock);

        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setName("Pix Teste");
        paymentMethod = paymentMethodRepository.save(paymentMethod);

        entityManager.flush();
        entityManager.clear();

        return new TestData(client, employee, product, paymentMethod, stock);
    }

    private SaleRequestDTO saleRequest(Integer clientId, Integer employeeId, Integer productId, Integer paymentMethodId, int quantity) {
        BigDecimal total = BigDecimal.TEN.multiply(BigDecimal.valueOf(quantity));

        return SaleRequestDTO.builder()
                .clientId(clientId)
                .employeeId(employeeId)
                .discount(BigDecimal.ZERO)
                .notes("Venda de persistencia")
                .items(List.of(SaleItemDTO.builder()
                        .productId(productId)
                        .quantity(quantity)
                        .unitPrice(BigDecimal.TEN)
                        .discount(BigDecimal.ZERO)
                        .build()))
                .payments(List.of(SalePaymentDTO.builder()
                        .paymentMethodId(paymentMethodId)
                        .amount(total)
                        .build()))
                .build();
    }

    private record TestData(
            Client client,
            Employee employee,
            Product product,
            PaymentMethod paymentMethod,
            Stock stock) {
    }
}
