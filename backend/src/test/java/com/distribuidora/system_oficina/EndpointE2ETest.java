package com.distribuidora.system_oficina;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.paymentMethod.entity.PaymentMethod;
import com.distribuidora.system_oficina.paymentMethod.repository.PaymentMethodRepository;
import com.distribuidora.system_oficina.role.entity.Role;
import com.distribuidora.system_oficina.role.repository.RoleRepository;
import com.fasterxml.jackson.databind.JsonNode;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class EndpointE2ETest {

    private static final String ADMIN_EMAIL = "admin.e2e@test.local";
    private static final String ADMIN_PASSWORD = "password123";

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private HttpHeaders authHeaders;
    private Integer paymentMethodId;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ADMIN").orElseGet(() -> {
            Role role = new Role();
            role.setName("ADMIN");
            role.setDescription("Administrator");
            return roleRepository.save(role);
        });

        employeeRepository.findByEmail(ADMIN_EMAIL).orElseGet(() -> {
            Employee employee = new Employee();
            employee.setName("Admin E2E");
            employee.setCpf("00000000000");
            employee.setEmail(ADMIN_EMAIL);
            employee.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            employee.setPhone("11999999999");
            employee.setRole(adminRole);
            employee.setStatus(true);
            return employeeRepository.save(employee);
        });

        paymentMethodId = paymentMethodRepository.findByName("Dinheiro")
                .orElseGet(() -> {
                    PaymentMethod paymentMethod = new PaymentMethod();
                    paymentMethod.setName("Dinheiro");
                    return paymentMethodRepository.save(paymentMethod);
                })
                .getId();

        ResponseEntity<JsonNode> login = restTemplate.postForEntity(
                "/auth/login",
                Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD),
                JsonNode.class);

        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(login.getBody()).isNotNull();

        authHeaders = new HttpHeaders();
        authHeaders.setContentType(MediaType.APPLICATION_JSON);
        authHeaders.setBearerAuth(login.getBody().get("token").asText());
    }

    @Test
    void allBackendEndpointsShouldRespondWithoutServerErrors() {
        int categoryId = createCategory("Filtros E2E");
        int supplierId = createSupplier("Fornecedor E2E", "12345678000190");
        int clientId = createClient("Cliente E2E", "12345678900");
        int employeeId = createEmployee("Operador E2E", "11111111111", "operador.e2e@test.local");
        int productId = createProduct("Produto E2E", categoryId, supplierId);
        int stockId = createStock(productId, 50, 5);

        assertOk(get("/categories"));
        assertOk(get("/categories/" + categoryId));
        assertOk(put("/categories/" + categoryId, categoryBody("Filtros E2E Atualizado")));

        assertOk(get("/suppliers"));
        assertOk(get("/suppliers/" + supplierId));
        assertOk(put("/suppliers/" + supplierId, supplierBody("Fornecedor E2E Atualizado", "12345678000190")));

        assertOk(get("/clients"));
        assertOk(get("/clients/" + clientId));
        assertOk(put("/clients/" + clientId, clientBody("Cliente E2E Atualizado", "12345678900")));

        assertOk(get("/employees"));
        assertOk(get("/employees/" + employeeId));
        assertOk(put("/employees/" + employeeId, employeeBody("Operador E2E Atualizado", "11111111111", "operador.e2e@test.local")));

        assertOk(get("/products"));
        assertOk(get("/products/" + productId));
        assertOk(put("/products/" + productId, productBody("Produto E2E Atualizado", categoryId, supplierId)));

        assertOk(get("/stock"));
        assertOk(get("/stock/" + stockId));
        assertOk(get("/stock/low"));
        assertOk(patch("/stock/" + stockId, stockBody(productId, 60, 10)));

        int purchaseToConfirmId = createPurchase(supplierId, employeeId, productId, 2);
        int purchaseToCancelId = createPurchase(supplierId, employeeId, productId, 1);
        assertOk(get("/purchases"));
        assertOk(get("/purchases/" + purchaseToConfirmId));
        assertOk(patch("/purchases/confirm/" + purchaseToConfirmId, null));
        assertOk(patch("/purchases/cancel/" + purchaseToCancelId, null));

        int saleToFinalizeId = createSale(clientId, employeeId, productId, 1);
        int saleToCancelId = createSale(clientId, employeeId, productId, 1);
        assertOk(get("/sales"));
        assertOk(get("/sales/" + saleToFinalizeId));
        assertOk(patch("/sales/finalize/" + saleToFinalizeId, null));
        assertOk(patch("/sales/cancel/" + saleToCancelId, null));

        assertOk(get("/stock/movements"));
        assertOk(get("/stock/movements/" + productId));

        int productToDeleteId = createProduct("Produto Delete E2E", categoryId, supplierId);
        int employeeToDeleteId = createEmployee("Delete E2E", "22222222222", "delete.e2e@test.local");
        int clientToDeleteId = createClient("Cliente Delete E2E", "98765432100");
        int supplierToDeleteId = createSupplier("Fornecedor Delete E2E", "98765432000199");
        int categoryToDeleteId = createCategory("Categoria Delete E2E");

        assertNoContent(delete("/products/" + productToDeleteId));
        assertNoContent(delete("/employees/" + employeeToDeleteId));
        assertNoContent(delete("/clients/" + clientToDeleteId));
        assertNoContent(delete("/suppliers/" + supplierToDeleteId));
        assertNoContent(delete("/categories/" + categoryToDeleteId));
    }

    private int createCategory(String name) {
        return idFrom(created(post("/categories", categoryBody(name))));
    }

    private int createSupplier(String name, String cnpj) {
        return idFrom(created(post("/suppliers", supplierBody(name, cnpj))));
    }

    private int createClient(String name, String cpfCnpj) {
        return idFrom(created(post("/clients", clientBody(name, cpfCnpj))));
    }

    private int createEmployee(String name, String cpf, String email) {
        return idFrom(created(post("/employees", employeeBody(name, cpf, email))));
    }

    private int createProduct(String name, int categoryId, int supplierId) {
        return idFrom(created(post("/products", productBody(name, categoryId, supplierId))));
    }

    private int createStock(int productId, int quantity, int minQuantity) {
        return idFrom(created(post("/stock", stockBody(productId, quantity, minQuantity))));
    }

    private int createPurchase(int supplierId, int employeeId, int productId, int quantity) {
        Map<String, Object> body = Map.of(
                "supplierId", supplierId,
                "employeeId", employeeId,
                "notes", "Compra E2E",
                "items", List.of(Map.of(
                        "productId", productId,
                        "quantity", quantity,
                        "unitCost", new BigDecimal("10.00"),
                        "subtotal", new BigDecimal("10.00").multiply(BigDecimal.valueOf(quantity)))));
        return idFrom(created(post("/purchases", body)));
    }

    private int createSale(int clientId, int employeeId, int productId, int quantity) {
        BigDecimal unitPrice = new BigDecimal("20.00");
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        Map<String, Object> body = Map.of(
                "clientId", clientId,
                "employeeId", employeeId,
                "discount", BigDecimal.ZERO,
                "notes", "Venda E2E",
                "items", List.of(Map.of(
                        "productId", productId,
                        "quantity", quantity,
                        "unitPrice", unitPrice,
                        "discount", BigDecimal.ZERO,
                        "subtotal", subtotal)),
                "payments", List.of(Map.of(
                        "paymentMethodId", paymentMethodId,
                        "amount", subtotal)));
        return idFrom(created(post("/sales", body)));
    }

    private Map<String, Object> categoryBody(String name) {
        return Map.of("name", name, "description", "Categoria criada pelo teste E2E");
    }

    private Map<String, Object> supplierBody(String name, String cnpj) {
        return Map.of(
                "name", name,
                "cnpj", cnpj,
                "email", "supplier.e2e@test.local",
                "phone", "11999999999",
                "address", "Rua E2E, 123",
                "city", "Sao Paulo",
                "state", "SP",
                "status", true);
    }

    private Map<String, Object> clientBody(String name, String cpfCnpj) {
        return Map.of(
                "name", name,
                "cpfCnpj", cpfCnpj,
                "email", "client.e2e@test.local",
                "clientType", "INDIVIDUAL",
                "phone", "11999999999",
                "address", "Rua E2E, 456",
                "city", "Sao Paulo",
                "state", "SP",
                "status", true);
    }

    private Map<String, Object> employeeBody(String name, String cpf, String email) {
        return Map.of(
                "name", name,
                "cpf", cpf,
                "email", email,
                "password", "password123",
                "roleName", "ADMIN",
                "phone", "11999999999",
                "status", true);
    }

    private Map<String, Object> productBody(String name, int categoryId, int supplierId) {
        return Map.of(
                "name", name,
                "description", "Produto criado pelo teste E2E",
                "partNumber", "PN-E2E",
                "barCode", "BAR-E2E",
                "categoryId", categoryId,
                "supplierId", supplierId,
                "costPrice", new BigDecimal("10.00"),
                "salePrice", new BigDecimal("20.00"),
                "unit", "UN",
                "status", true);
    }

    private Map<String, Object> stockBody(int productId, int quantity, int minQuantity) {
        return Map.of(
                "productId", productId,
                "quantity", quantity,
                "minQuantity", minQuantity,
                "location", "A1");
    }

    private ResponseEntity<JsonNode> get(String path) {
        return exchange(path, HttpMethod.GET, null);
    }

    private ResponseEntity<JsonNode> post(String path, Object body) {
        return exchange(path, HttpMethod.POST, body);
    }

    private ResponseEntity<JsonNode> put(String path, Object body) {
        return exchange(path, HttpMethod.PUT, body);
    }

    private ResponseEntity<JsonNode> patch(String path, Object body) {
        return exchange(path, HttpMethod.PATCH, body);
    }

    private ResponseEntity<JsonNode> delete(String path) {
        return exchange(path, HttpMethod.DELETE, null);
    }

    private ResponseEntity<JsonNode> exchange(String path, HttpMethod method, Object body) {
        return restTemplate.exchange(path, method, new HttpEntity<>(body, authHeaders), JsonNode.class);
    }

    private ResponseEntity<JsonNode> created(ResponseEntity<JsonNode> response) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        return response;
    }

    private void assertOk(ResponseEntity<JsonNode> response) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private void assertNoContent(ResponseEntity<JsonNode> response) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    private int idFrom(ResponseEntity<JsonNode> response) {
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().hasNonNull("id")).isTrue();
        return response.getBody().get("id").asInt();
    }
}
