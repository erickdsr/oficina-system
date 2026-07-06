package com.distribuidora.system_oficina.stock.entity;

import java.sql.Timestamp;

import org.hibernate.annotations.UpdateTimestamp;
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

@AllArgsConstructor
@Data
@NoArgsConstructor
@Table(name = "stock")
@Entity
public class Stock {
    

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
     
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "min_quantity", nullable = false)
    private Integer minQuantity = 5;
     
    @Column(name = "location", nullable = true, length = 50)
    private String location;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Timestamp updatedAt;
    
}
