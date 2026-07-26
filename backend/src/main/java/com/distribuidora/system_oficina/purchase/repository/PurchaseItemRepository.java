package com.distribuidora.system_oficina.purchase.repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.distribuidora.system_oficina.purchase.entity.PurchaseItem;

public interface PurchaseItemRepository extends JpaRepository <PurchaseItem, Integer> {

    List<PurchaseItem> findByPurchaseId(Integer purchaseId);
    List<PurchaseItem> findByProductId(Integer productId);
    long countByPurchaseId(Integer purchaseId);
    long countByPurchaseIdIn(Collection<Integer> purchaseIds);
    long countByProductIdIn(Collection<Integer> productIds);

    @Modifying
    @Query("delete from PurchaseItem item where item.purchase.id in :purchaseIds")
    void deleteAllByPurchaseIdIn(@Param("purchaseIds") Collection<Integer> purchaseIds);

    @Query("select distinct item.purchase.id from PurchaseItem item where item.product.id in :productIds")
    Set<Integer> findPurchaseIdsByProductIdIn(@Param("productIds") Collection<Integer> productIds);

    @Modifying
    @Query("delete from PurchaseItem item where item.product.id in :productIds")
    void deleteAllByProductIdIn(@Param("productIds") Collection<Integer> productIds);
}
