package com.distribuidora.system_oficina.sale.entity;

import java.math.BigDecimal;

import com.distribuidora.system_oficina.product.entity.Product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sale_items")
public class SaleItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)         
    private Product product;  
    
    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit_price")
    private  BigDecimal unitPrice;

    @Column(name = "discount")
    private BigDecimal discount;
    
    @Column(name = "subtotal")
    private BigDecimal subtotal;
}
