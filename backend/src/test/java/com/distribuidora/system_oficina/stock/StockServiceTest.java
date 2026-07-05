



package com.distribuidora.system_oficina.stock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import com.distribuidora.system_oficina.stock.entity.Stock;
import com.distribuidora.system_oficina.stock.entity.StockMovement;
import com.distribuidora.system_oficina.stock.entity.StockMovementType;
import com.distribuidora.system_oficina.stock.repository.StockMovementRepository;
import com.distribuidora.system_oficina.stock.repository.StockRepository;
import com.distribuidora.system_oficina.stock.service.StockService;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private StockRepository stockRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private StockService stockService;

    @Test
    @DisplayName("registerMovement com ENTRADA deve somar a quantidade ao estoque")
    void registerMovement_entrada_deveSomarQuantidadeAoEstoque() {
        // Arrange
        Product product = new Product();
        Employee employee = new Employee();
        Stock stock = new Stock();
        stock.setQuantity(10);
        when(stockRepository.findByProduct(product)).thenReturn(Optional.of(stock));
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        stockService.registerMovement(product, employee, StockMovementType.ENTRADA, 3, "Entrada de teste");

        // Assert
        assertThat(stock.getQuantity()).isEqualTo(13);
        verify(stockRepository).save(stock);
        verify(stockMovementRepository).save(any(StockMovement.class));
    }

    @Test
    @DisplayName("registerMovement com SAIDA deve subtrair a quantidade do estoque")
    void registerMovement_saida_deveSubtrairQuantidadeDoEstoque() {
        // Arrange
        Product product = new Product();
        Employee employee = new Employee();
        Stock stock = new Stock();
        stock.setQuantity(10);
        when(stockRepository.findByProduct(product)).thenReturn(Optional.of(stock));
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        stockService.registerMovement(product, employee, StockMovementType.SAIDA, 4, "Saída de teste");

        // Assert
        assertThat(stock.getQuantity()).isEqualTo(6);
        verify(stockRepository).save(stock);
        verify(stockMovementRepository).save(any(StockMovement.class));
    }

    @Test
    @DisplayName("registerMovement com SAIDA deve lançar exceção quando estoque é insuficiente")
    void registerMovement_saidaComEstoqueInsuficiente_deveLancarExcecao() {
        // Arrange
        Product product = new Product();
        Employee employee = new Employee();
        Stock stock = new Stock();
        stock.setQuantity(3);
        when(stockRepository.findByProduct(product)).thenReturn(Optional.of(stock));

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
            stockService.registerMovement(product, employee, StockMovementType.SAIDA, 10, "teste")
        );
        verify(stockRepository, never()).save(any());
        verify(stockMovementRepository, never()).save(any());
    }

    @Test
    @DisplayName("registerMovement com AJUSTE deve substituir a quantidade do estoque")
    void registerMovement_ajuste_deveSubstituirQuantidade() {
        // Arrange
        Product product = new Product();
        Employee employee = new Employee();
        Stock stock = new Stock();
        stock.setQuantity(5);
        when(stockRepository.findByProduct(product)).thenReturn(Optional.of(stock));
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        stockService.registerMovement(product, employee, StockMovementType.AJUSTE, 8, "Ajuste de estoque");

        // Assert
        assertThat(stock.getQuantity()).isEqualTo(8);
        verify(stockRepository).save(stock);
        verify(stockMovementRepository).save(any(StockMovement.class));
    }

    @Test
    @DisplayName("registerMovement deve lançar exceção quando o estoque do produto não existe")
    void registerMovement_produtoNaoEncontrado_deveLancarExcecao() {
        // Arrange
        Product product = new Product();
        Employee employee = new Employee();
        when(stockRepository.findByProduct(product)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
            stockService.registerMovement(product, employee, StockMovementType.ENTRADA, 1, "teste")
        );
        verify(stockRepository, never()).save(any());
        verify(stockMovementRepository, never()).save(any());
    }

    @Test
    @DisplayName("listLowStock deve retornar apenas os itens abaixo do estoque mínimo")
    void listLowStock_deveRetornarApenasEstoqueAbaixoDoMinimo() {
        // Arrange
        Stock lowStock = new Stock();
        lowStock.setQuantity(2);
        lowStock.setMinQuantity(5);
        Product product = new Product();
        product.setId(10);
        lowStock.setProduct(product);

        Stock regularStock = new Stock();
        regularStock.setQuantity(10);
        regularStock.setMinQuantity(5);
        Product regularProduct = new Product();
        regularProduct.setId(11);
        regularStock.setProduct(regularProduct);

        when(stockRepository.findAll()).thenReturn(List.of(lowStock, regularStock));

        // Act
        List<Stock> result = stockService.listLowStock().stream().map(dto -> {
            Stock stock = new Stock();
            stock.setQuantity(dto.getQuantity());
            stock.setMinQuantity(dto.getMinQuantity());
            stock.setProduct(new Product());
            return stock;
        }).toList();

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getQuantity()).isEqualTo(2);
    }

    @Test
    @DisplayName("listLowStock sem estoque baixo deve retornar uma lista vazia")
    void listLowStock_semEstoqueBaixo_deveRetornarListaVazia() {
        // Arrange
        Stock stock = new Stock();
        stock.setQuantity(7);
        stock.setMinQuantity(5);

        when(stockRepository.findAll()).thenReturn(List.of(stock));

        // Act
        List<?> result = stockService.listLowStock();

        // Assert
        assertThat(result).isEmpty();
    }
}
