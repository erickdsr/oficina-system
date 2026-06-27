package com.distribuidora.system_oficina.sale.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
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
import com.distribuidora.system_oficina.stock.entity.Stock;
import com.distribuidora.system_oficina.stock.repository.StockRepository;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SaleControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
        employee.setPassword("123456");
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
    void shouldCreateAndFinalizeSaleThroughHttpEndpoints() throws Exception {
        Client client = clientRepository.findAll().get(0);
        Employee employee = employeeRepository.findAll().get(0);
        Product product = productRepository.findAll().get(0);
        PaymentMethod paymentMethod = paymentMethodRepository.findAll().get(0);

        String createPayload = "{" +
                "\"clientId\":" + client.getId() + "," +
                "\"employeeId\":" + employee.getId() + "," +
                "\"discount\":\"2.00\"," +
                "\"notes\":\"Venda via controller\"," +
                "\"items\":[{" +
                "\"productId\":" + product.getId() + "," +
                "\"quantity\":2," +
                "\"unitPrice\":\"25.00\"," +
                "\"discount\":\"0.00\"," +
                "\"subtotal\":\"50.00\"" +
                "}]," +
                "\"payments\":[{" +
                "\"paymentMethodId\":" + paymentMethod.getId() + "," +
                "\"amount\":\"48.00\"" +
                "}]" +
                "}";

        String responseBody = mockMvc.perform(post("/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PENDENTE")))
                .andExpect(jsonPath("$.total", is(48.00)))
                .andReturn().getResponse().getContentAsString();

        Integer saleId = objectMapper.readTree(responseBody).get("id").asInt();

        mockMvc.perform(get("/sales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/sales/" + saleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(saleId)));

        String finalizePayload = "{" +
                "\"clientId\":" + client.getId() + "," +
                "\"employeeId\":" + employee.getId() + "," +
                "\"discount\":\"0.00\"," +
                "\"notes\":\"Finalize\"," +
                "\"items\":[]," +
                "\"payments\":[]" +
                "}";

        mockMvc.perform(patch("/sales/finalize/" + saleId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(finalizePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RECEBIDA")));
    }
}
