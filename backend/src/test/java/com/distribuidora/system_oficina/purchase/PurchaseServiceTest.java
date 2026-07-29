



package com.distribuidora.system_oficina.purchase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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

import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import com.distribuidora.system_oficina.purchase.dto.PurchaseItemDTO;
import com.distribuidora.system_oficina.purchase.dto.PurchaseDeletionAction;
import com.distribuidora.system_oficina.purchase.dto.PurchaseDeletionResponse;
import com.distribuidora.system_oficina.purchase.dto.PurchaseRequestDTO;
import com.distribuidora.system_oficina.purchase.dto.PurchaseResponseDTO;
import com.distribuidora.system_oficina.purchase.entity.Purchase;
import com.distribuidora.system_oficina.purchase.entity.PurchaseItem;
import com.distribuidora.system_oficina.purchase.entity.Status;
import com.distribuidora.system_oficina.purchase.repository.PurchaseItemRepository;
import com.distribuidora.system_oficina.purchase.repository.PurchaseRepository;
import com.distribuidora.system_oficina.purchase.service.PurchaseService;
import com.distribuidora.system_oficina.stock.service.StockService;
import com.distribuidora.system_oficina.stock.repository.StockMovementRepository;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;

@ExtendWith(MockitoExtension.class)
class PurchaseServiceTest {

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private PurchaseItemRepository purchaseItemRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockService stockService;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @InjectMocks
    private PurchaseService purchaseService;

    @Test
    @DisplayName("createPurchase com dados válidos deve criar a compra com status PENDENTE")
    void createPurchase_dadosValidos_deveCriarCompraComStatusPendente() {
        // Arrange
        Supplier supplier = new Supplier();
        supplier.setId(1);
        Employee employee = new Employee();
        employee.setId(2);
        Product product = new Product();
        product.setId(10);

        when(supplierRepository.findById(1)).thenReturn(Optional.of(supplier));
        when(employeeRepository.findById(2)).thenReturn(Optional.of(employee));
        when(productRepository.findById(10)).thenReturn(Optional.of(product));
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseRequestDTO request = PurchaseRequestDTO.builder()
                .supplierId(1)
                .employeeId(2)
                .notes("Compra teste")
                .items(List.of(PurchaseItemDTO.builder()
                        .productId(10)
                        .quantity(2)
                        .unitCost(new BigDecimal("10.00"))
                        .build()))
                .build();

        // Act
        PurchaseResponseDTO result = purchaseService.createPurchase(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(Status.PENDENTE);
        assertThat(result.getTotal()).isEqualByComparingTo("20.00");
        assertThat(result.getNotes()).isEqualTo("Compra teste");
    }

    @Test
    @DisplayName("createPurchase deve calcular o total corretamente")
    void createPurchase_deveCalcularTotalCorretamente() {
        // Arrange
        Supplier supplier = new Supplier();
        supplier.setId(1);
        Employee employee = new Employee();
        employee.setId(2);
        Product product = new Product();
        product.setId(10);

        when(supplierRepository.findById(1)).thenReturn(Optional.of(supplier));
        when(employeeRepository.findById(2)).thenReturn(Optional.of(employee));
        when(productRepository.findById(10)).thenReturn(Optional.of(product));
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseRequestDTO request = PurchaseRequestDTO.builder()
                .supplierId(1)
                .employeeId(2)
                .items(List.of(PurchaseItemDTO.builder()
                        .productId(10)
                        .quantity(3)
                        .unitCost(new BigDecimal("4.50"))
                        .build()))
                .build();

        // Act
        PurchaseResponseDTO result = purchaseService.createPurchase(request);

        // Assert
        assertThat(result.getTotal()).isEqualByComparingTo("13.50");
    }

    @Test
    @DisplayName("confirmPurchase deve chamar registerMovement para cada item da compra")
    void confirmPurchase_deveCharmarRegisterMovementEntradaParaCadaItem() {
        // Arrange
        Purchase purchase = new Purchase();
        purchase.setId(1);
        purchase.setStatus(Status.PENDENTE);
        Employee employee = new Employee();
        employee.setId(2);
        purchase.setEmployee(employee);

        PurchaseItem item1 = new PurchaseItem();
        item1.setProduct(new Product());
        item1.setQuantity(2);
        PurchaseItem item2 = new PurchaseItem();
        item2.setProduct(new Product());
        item2.setQuantity(1);
        purchase.setItems(List.of(item1, item2));

        when(purchaseRepository.findById(1)).thenReturn(Optional.of(purchase));
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        purchaseService.confirmPurchase(1);

        // Assert
        verify(stockService, org.mockito.Mockito.times(2)).registerMovement(any(Product.class), any(Employee.class), any(), any(Integer.class), any(String.class));
    }

    @Test
    @DisplayName("confirmPurchase deve alterar o status para RECEBIDA")
    void confirmPurchase_deveAlterarStatusParaRecebida() {
        // Arrange
        Purchase purchase = new Purchase();
        purchase.setId(1);
        purchase.setStatus(Status.PENDENTE);
        purchase.setItems(List.of());
        when(purchaseRepository.findById(1)).thenReturn(Optional.of(purchase));
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        PurchaseResponseDTO result = purchaseService.confirmPurchase(1);

        // Assert
        assertThat(result.getStatus()).isEqualTo(Status.RECEBIDA);
    }

    @Test
    @DisplayName("confirmPurchase com status diferente de PENDENTE deve lançar exceção")
    void confirmPurchase_statusNaoPendente_deveLancarExcecao() {
        // Arrange
        Purchase purchase = new Purchase();
        purchase.setStatus(Status.RECEBIDA);
        when(purchaseRepository.findById(1)).thenReturn(Optional.of(purchase));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> purchaseService.confirmPurchase(1));
        verify(stockService, never()).registerMovement(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("cancelPurchase com status RECEBIDA deve lançar exceção")
    void cancelPurchase_statusRecebida_deveLancarExcecao() {
        // Arrange
        Purchase purchase = new Purchase();
        purchase.setStatus(Status.RECEBIDA);
        when(purchaseRepository.findById(1)).thenReturn(Optional.of(purchase));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> purchaseService.cancelPurchase(1));
        verify(purchaseRepository, never()).save(any());
    }

    @Test
    @DisplayName("cancelPurchase deve alterar o status para CANCELADA")
    void cancelPurchase_deveAlterarStatusParaCancelada() {
        // Arrange
        Purchase purchase = new Purchase();
        purchase.setStatus(Status.PENDENTE);
        when(purchaseRepository.findById(1)).thenReturn(Optional.of(purchase));
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        PurchaseResponseDTO result = purchaseService.cancelPurchase(1);

        // Assert
        assertThat(result.getStatus()).isEqualTo(Status.CANCELADA);
    }

    @Test
    @DisplayName("deletePurchase pendente sem movimentacoes deve excluir fisicamente sem apagar fornecedor ou produto")
    void deletePurchase_pendenteSemMovimentacoes_deveExcluirFisicamente() {
        Supplier supplier = new Supplier();
        supplier.setId(1);
        Product product = new Product();
        product.setId(10);

        Purchase purchase = new Purchase();
        purchase.setId(1);
        purchase.setSupplier(supplier);
        purchase.setStatus(Status.PENDENTE);

        PurchaseItem item = new PurchaseItem();
        item.setProduct(product);
        item.setPurchase(purchase);
        purchase.setItems(List.of(item));

        when(purchaseRepository.findById(1)).thenReturn(Optional.of(purchase));
        when(stockMovementRepository.countByReasonContaining("Compra #1 recebida")).thenReturn(0L);

        PurchaseDeletionResponse result = purchaseService.deletePurchase(1);

        assertThat(result.action()).isEqualTo(PurchaseDeletionAction.DELETED);
        verify(purchaseItemRepository).deleteAllByPurchaseIdIn(List.of(1));
        verify(purchaseRepository).delete(purchase);
        verify(supplierRepository, never()).delete(any());
        verify(productRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deletePurchase recebida deve desativar e preservar historico")
    void deletePurchase_recebida_deveDesativar() {
        Purchase purchase = new Purchase();
        purchase.setId(2);
        purchase.setStatus(Status.RECEBIDA);
        purchase.setActive(true);
        purchase.setItems(List.of(new PurchaseItem(), new PurchaseItem()));

        when(purchaseRepository.findById(2)).thenReturn(Optional.of(purchase));
        when(stockMovementRepository.countByReasonContaining("Compra #2 recebida")).thenReturn(2L);
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseDeletionResponse result = purchaseService.deletePurchase(2);

        assertThat(result.action()).isEqualTo(PurchaseDeletionAction.DEACTIVATED);
        assertThat(purchase.getActive()).isFalse();
        assertThat(result.dependencies()).containsEntry("purchaseItems", 2L).containsEntry("stockMovements", 2L);
        verify(purchaseRepository, never()).delete(any(Purchase.class));
        verify(purchaseItemRepository, never()).deleteAllByPurchaseIdIn(any());
    }

    @Test
    @DisplayName("deletePurchase cancelada com historico deve desativar")
    void deletePurchase_canceladaComHistorico_deveDesativar() {
        Purchase purchase = new Purchase();
        purchase.setId(3);
        purchase.setStatus(Status.CANCELADA);
        purchase.setActive(true);
        purchase.setItems(List.of());

        when(purchaseRepository.findById(3)).thenReturn(Optional.of(purchase));
        when(stockMovementRepository.countByReasonContaining("Compra #3 recebida")).thenReturn(1L);
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseDeletionResponse result = purchaseService.deletePurchase(3);

        assertThat(result.action()).isEqualTo(PurchaseDeletionAction.DEACTIVATED);
        assertThat(purchase.getActive()).isFalse();
        verify(purchaseRepository, never()).delete(any(Purchase.class));
    }
}
