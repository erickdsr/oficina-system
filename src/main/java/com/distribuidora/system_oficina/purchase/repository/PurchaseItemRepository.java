package com.distribuidora.system_oficina.purchase.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.purchase.entity.PurchaseItem;

public interface PurchaseItemRepository extends JpaRepository <PurchaseItem, Integer> {

    List<PurchaseItem> findByPurchaseId(Integer purchaseId);
    List<PurchaseItem> findByProductId(Integer productId);
}