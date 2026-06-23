package com.distribuidora.system_oficina.purchase.entity;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.supplier.entity.Supplier;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "purchases")
public class Purchase {

      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Integer id;
      
      @ManyToOne
      @JoinColumn(name = "supplier_id")
      private Supplier supplier;
      
      @ManyToOne
      @JoinColumn(name = "employee_id")
      private Employee employee;
       
      @Column(name = "total")
      private BigDecimal total;
      
      @Enumerated(EnumType.STRING)
      @Column(name = "status")
      private Status status;
      
      @Column(name = "notes")
      private String notes;

      @CreationTimestamp
      @Column(name = "created_at")
      private Timestamp createdAt;

      @UpdateTimestamp
      @Column(name = "updated_at")
      private Timestamp updatedAt;

      @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL)
      private List<PurchaseItem> items;

}
