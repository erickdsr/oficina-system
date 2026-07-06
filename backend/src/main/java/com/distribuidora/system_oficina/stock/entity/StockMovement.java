package com.distribuidora.system_oficina.stock.entity;

import java.sql.Timestamp;
import org.hibernate.annotations.CreationTimestamp;
import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.product.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@NoArgsConstructor
@Data
@Entity
@Table(name = "stock_movements")
public class StockMovement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private StockMovementType type;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private Timestamp createdAt;
}
