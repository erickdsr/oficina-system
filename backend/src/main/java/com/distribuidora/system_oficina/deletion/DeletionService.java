package com.distribuidora.system_oficina.deletion;

import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.client.entity.Client;
import com.distribuidora.system_oficina.client.repository.ClientRepository;
import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import com.distribuidora.system_oficina.product.service.ProductDependencyDeletionService;
import com.distribuidora.system_oficina.purchase.entity.Purchase;
import com.distribuidora.system_oficina.purchase.repository.PurchaseItemRepository;
import com.distribuidora.system_oficina.purchase.repository.PurchaseRepository;
import com.distribuidora.system_oficina.sale.entity.Sale;
import com.distribuidora.system_oficina.sale.repository.SaleItemRepository;
import com.distribuidora.system_oficina.sale.repository.SalePaymentsRepository;
import com.distribuidora.system_oficina.sale.repository.SaleRepository;
import com.distribuidora.system_oficina.stock.repository.StockMovementRepository;
import com.distribuidora.system_oficina.stock.repository.StockRepository;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DeletionService {

    private final CategoryRepository categoryRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final ProductDependencyDeletionService productDependencyDeletionService;
    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final SalePaymentsRepository salePaymentsRepository;
    private final StockRepository stockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public DeletionReportDTO report(DeletionResource resource, Integer id) {
        assertExists(resource, id);
        Map<String, Long> dependencies = dependenciesFor(resource, id);
        boolean hasDependencies = dependencies.values().stream().anyMatch(count -> count > 0);
        return new DeletionReportDTO(resource.name(), id, hasDependencies, !hasDependencies, dependencies);
    }

    @Transactional
    public DeletionResultDTO delete(DeletionResource resource, Integer id) {
        DeletionReportDTO report = report(resource, id);
        if (report.hasDependencies()) {
            softDelete(resource, id);
            return new DeletionResultDTO(
                    resource.name(),
                    id,
                    DeletionMode.SOFT_DELETE,
                    label(resource) + " desativado com sucesso.",
                    "O historico foi preservado.",
                    report);
        }

        deleteRoot(resource, id);
        return new DeletionResultDTO(
                resource.name(),
                id,
                DeletionMode.PHYSICAL_DELETE,
                label(resource) + " excluido com sucesso.",
                "Nenhum vinculo historico foi encontrado.",
                report);
    }

    @Transactional
    public DeletionResultDTO forceDelete(DeletionResource resource, Integer id) {
        DeletionReportDTO report = report(resource, id);

        switch (resource) {
            case CATEGORY -> forceDeleteCategory(id);
            case CLIENT -> forceDeleteClient(id);
            case EMPLOYEE -> forceDeleteEmployee(id);
            case PRODUCT -> forceDeleteProduct(id);
            case SUPPLIER -> forceDeleteSupplier(id);
        }

        return new DeletionResultDTO(
                resource.name(),
                id,
                DeletionMode.FORCE_DELETE,
                label(resource) + " excluido definitivamente.",
                "Os registros vinculados foram removidos em ordem segura.",
                report);
    }

    private Map<String, Long> dependenciesFor(DeletionResource resource, Integer id) {
        return switch (resource) {
            case CATEGORY -> categoryDependencies(id);
            case CLIENT -> clientDependencies(id);
            case EMPLOYEE -> employeeDependencies(id);
            case PRODUCT -> productDependencies(id);
            case SUPPLIER -> supplierDependencies(id);
        };
    }

    private Map<String, Long> categoryDependencies(Integer id) {
        List<Integer> productIds = productRepository.findAllByCategoryId(id).stream().map(Product::getId).toList();
        Map<String, Long> dependencies = new LinkedHashMap<>();
        dependencies.put("products", (long) productIds.size());
        addProductTreeCounts(dependencies, productIds);
        return dependencies;
    }

    private Map<String, Long> clientDependencies(Integer id) {
        List<Integer> saleIds = saleRepository.findByClientId(id).stream().map(Sale::getId).toList();
        Map<String, Long> dependencies = new LinkedHashMap<>();
        dependencies.put("sales", (long) saleIds.size());
        dependencies.put("saleItems", saleIds.isEmpty() ? 0 : saleItemRepository.countBySaleIdIn(saleIds));
        dependencies.put("salePayments", saleIds.isEmpty() ? 0 : salePaymentsRepository.countBySaleIdIn(saleIds));
        return dependencies;
    }

    private Map<String, Long> employeeDependencies(Integer id) {
        Map<String, Long> dependencies = new LinkedHashMap<>();
        dependencies.put("purchases", purchaseRepository.countByEmployeeId(id));
        dependencies.put("sales", saleRepository.countByEmployeeId(id));
        dependencies.put("movements", stockMovementRepository.countByEmployeeId(id));
        return dependencies;
    }

    private Map<String, Long> productDependencies(Integer id) {
        Map<String, Long> dependencies = new LinkedHashMap<>();
        addProductTreeCounts(dependencies, List.of(id));
        return dependencies;
    }

    private Map<String, Long> supplierDependencies(Integer id) {
        List<Integer> productIds = productRepository.findAllBySupplierId(id).stream().map(Product::getId).toList();
        List<Integer> purchaseIds = purchaseRepository.findBySupplierId(id).stream().map(Purchase::getId).toList();
        Map<String, Long> dependencies = new LinkedHashMap<>();
        dependencies.put("products", (long) productIds.size());
        dependencies.put("purchases", (long) purchaseIds.size());
        dependencies.put("purchaseItems", purchaseIds.isEmpty() ? 0 : purchaseItemRepository.countByPurchaseIdIn(purchaseIds));
        addProductTreeCounts(dependencies, productIds);
        return dependencies;
    }

    private void addProductTreeCounts(Map<String, Long> dependencies, Collection<Integer> productIds) {
        dependencies.putIfAbsent("stock", 0L);
        dependencies.putIfAbsent("movements", 0L);
        dependencies.putIfAbsent("purchaseItems", 0L);
        dependencies.putIfAbsent("sales", 0L);
        dependencies.putIfAbsent("saleItems", 0L);

        if (productIds.isEmpty()) {
            return;
        }

        List<Integer> saleIds = saleItemRepository.findSaleIdsByProductIdIn(productIds).stream().toList();
        dependencies.compute("stock", (key, value) -> value + stockRepository.countByProductIdIn(productIds));
        dependencies.compute("movements", (key, value) -> value + stockMovementRepository.countByProductIdIn(productIds));
        dependencies.compute("purchaseItems", (key, value) -> value + purchaseItemRepository.countByProductIdIn(productIds));
        dependencies.compute("sales", (key, value) -> value + saleIds.size());
        dependencies.compute("saleItems", (key, value) -> value + saleItemRepository.countByProductIdIn(productIds));
    }

    private void softDelete(DeletionResource resource, Integer id) {
        switch (resource) {
            case CATEGORY -> {
                Category category = findCategory(id);
                category.setStatus(false);
                categoryRepository.save(category);
            }
            case CLIENT -> {
                Client client = findClient(id);
                client.setStatus(false);
                clientRepository.save(client);
            }
            case EMPLOYEE -> {
                Employee employee = findEmployee(id);
                employee.setStatus(false);
                employeeRepository.save(employee);
            }
            case PRODUCT -> {
                Product product = findProduct(id);
                product.setStatus(false);
                productRepository.save(product);
            }
            case SUPPLIER -> {
                Supplier supplier = findSupplier(id);
                supplier.setStatus(false);
                supplierRepository.save(supplier);
            }
        }
    }

    private void deleteRoot(DeletionResource resource, Integer id) {
        switch (resource) {
            case CATEGORY -> categoryRepository.delete(findCategory(id));
            case CLIENT -> clientRepository.delete(findClient(id));
            case EMPLOYEE -> employeeRepository.delete(findEmployee(id));
            case PRODUCT -> productRepository.delete(findProduct(id));
            case SUPPLIER -> supplierRepository.delete(findSupplier(id));
        }
    }

    private void forceDeleteCategory(Integer id) {
        List<Product> products = productRepository.findAllByCategoryId(id);
        List<Integer> productIds = products.stream().map(Product::getId).toList();
        productDependencyDeletionService.deleteByProductIds(productIds);
        productRepository.deleteAll(products);
        categoryRepository.delete(findCategory(id));
    }

    private void forceDeleteClient(Integer id) {
        List<Sale> sales = saleRepository.findByClientId(id);
        deleteSales(sales);
        clientRepository.delete(findClient(id));
    }

    private void forceDeleteEmployee(Integer id) {
        List<Purchase> purchases = purchaseRepository.findByEmployeeId(id);
        deletePurchases(purchases);
        List<Sale> sales = saleRepository.findByEmployeeId(id);
        deleteSales(sales);
        stockMovementRepository.deleteAllByEmployeeId(id);
        employeeRepository.delete(findEmployee(id));
    }

    private void forceDeleteProduct(Integer id) {
        productDependencyDeletionService.deleteByProductIds(List.of(id));
        productRepository.delete(findProduct(id));
    }

    private void forceDeleteSupplier(Integer id) {
        List<Purchase> purchases = purchaseRepository.findBySupplierId(id);
        deletePurchases(purchases);
        List<Product> products = productRepository.findAllBySupplierId(id);
        List<Integer> productIds = products.stream().map(Product::getId).toList();
        productDependencyDeletionService.deleteByProductIds(productIds);
        productRepository.deleteAll(products);
        supplierRepository.delete(findSupplier(id));
    }

    private void deletePurchases(List<Purchase> purchases) {
        if (purchases.isEmpty()) {
            return;
        }
        List<Integer> purchaseIds = purchases.stream().map(Purchase::getId).toList();
        purchaseItemRepository.deleteAllByPurchaseIdIn(purchaseIds);
        purchaseRepository.deleteAll(purchases);
    }

    private void deleteSales(List<Sale> sales) {
        if (sales.isEmpty()) {
            return;
        }
        List<Integer> saleIds = sales.stream().map(Sale::getId).toList();
        salePaymentsRepository.deleteAllBySaleIdIn(saleIds);
        saleItemRepository.deleteAllBySaleIdIn(saleIds);
        saleRepository.deleteAll(sales);
    }

    private void assertExists(DeletionResource resource, Integer id) {
        switch (resource) {
            case CATEGORY -> findCategory(id);
            case CLIENT -> findClient(id);
            case EMPLOYEE -> findEmployee(id);
            case PRODUCT -> findProduct(id);
            case SUPPLIER -> findSupplier(id);
        }
    }

    private Category findCategory(Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found with id: " + id));
    }

    private Client findClient(Integer id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found with id: " + id));
    }

    private Employee findEmployee(Integer id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found with id: " + id));
    }

    private Product findProduct(Integer id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id));
    }

    private Supplier findSupplier(Integer id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found with id: " + id));
    }

    private String label(DeletionResource resource) {
        return switch (resource) {
            case CATEGORY -> "Categoria";
            case CLIENT -> "Cliente";
            case EMPLOYEE -> "Funcionario";
            case PRODUCT -> "Produto";
            case SUPPLIER -> "Fornecedor";
        };
    }
}
