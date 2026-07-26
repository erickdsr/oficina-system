package com.distribuidora.system_oficina.product.service;

import com.distribuidora.system_oficina.purchase.entity.PurchaseItem;
import com.distribuidora.system_oficina.purchase.repository.PurchaseItemRepository;
import com.distribuidora.system_oficina.purchase.repository.PurchaseRepository;
import com.distribuidora.system_oficina.sale.entity.SaleItem;
import com.distribuidora.system_oficina.sale.repository.SaleItemRepository;
import com.distribuidora.system_oficina.sale.repository.SaleRepository;
import com.distribuidora.system_oficina.stock.repository.StockMovementRepository;
import com.distribuidora.system_oficina.stock.repository.StockRepository;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductDependencyDeletionService {

    private final StockMovementRepository stockMovementRepository;
    private final StockRepository stockRepository;
    private final SaleItemRepository saleItemRepository;
    private final SaleRepository saleRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final PurchaseRepository purchaseRepository;

    public void deleteByProductIds(Collection<Integer> productIds) {
        if (productIds.isEmpty()) {
            return;
        }

        Set<Integer> affectedSaleIds = saleItemRepository.findSaleIdsByProductIdIn(productIds);
        Set<Integer> affectedPurchaseIds = purchaseItemRepository.findPurchaseIdsByProductIdIn(productIds);

        stockMovementRepository.deleteAllByProductIdIn(productIds);
        stockRepository.deleteAllByProductIdIn(productIds);
        saleItemRepository.deleteAllByProductIdIn(productIds);
        purchaseItemRepository.deleteAllByProductIdIn(productIds);

        recalculateAffectedSales(affectedSaleIds);
        recalculateAffectedPurchases(affectedPurchaseIds);
    }

    private void recalculateAffectedSales(Set<Integer> saleIds) {
        for (Integer saleId : saleIds) {
            var remainingItems = saleItemRepository.findBySaleId(saleId);
            if (remainingItems.isEmpty()) {
                saleRepository.findById(saleId).ifPresent(saleRepository::delete);
                continue;
            }

            saleRepository.findById(saleId).ifPresent(sale -> {
                BigDecimal itemsTotal = remainingItems.stream()
                        .map(SaleItem::getSubtotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal discount = sale.getDiscount() != null ? sale.getDiscount() : BigDecimal.ZERO;
                sale.setTotal(itemsTotal.subtract(discount).max(BigDecimal.ZERO));
                saleRepository.save(sale);
            });
        }
    }

    private void recalculateAffectedPurchases(Set<Integer> purchaseIds) {
        for (Integer purchaseId : purchaseIds) {
            var remainingItems = purchaseItemRepository.findByPurchaseId(purchaseId);
            if (remainingItems.isEmpty()) {
                purchaseRepository.findById(purchaseId).ifPresent(purchaseRepository::delete);
                continue;
            }

            purchaseRepository.findById(purchaseId).ifPresent(purchase -> {
                BigDecimal total = remainingItems.stream()
                        .map(PurchaseItem::getSubtotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                purchase.setTotal(total.max(BigDecimal.ZERO));
                purchaseRepository.save(purchase);
            });
        }
    }
}
