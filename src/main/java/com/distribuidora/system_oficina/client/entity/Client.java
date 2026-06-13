package com.distribuidora.system_oficina.client.entity;

import java.sql.Timestamp;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "email", nullable = false, length = 254)
    private String email;

    @Column(name =  "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "cpfcnpj", nullable = false, length = 20)
    private String cpfcnpj;

    @Column(name = "clientype", nullable = false, length = 10)
    private String clientType;

    @Column(name = "adress", length = 255)
    private String address;

    @Column(name = "city", length = 150)
    private String city;

    @Column(name = "state", length = 2)
    private String state;

    @Column(name = "status", nullable = false)
    private Boolean status = true; 
     
    @CreationTimestamp
    @Column(name = "createdAt", nullable = false)
    private Timestamp createdAt;
     
    @UpdateTimestamp
    @Column(name = "updatedAt", nullable = false)
    private Timestamp updatedAt;

     @PrePersist
    protected void onCreate() {
        this.createdAt = new Timestamp(System.currentTimeMillis());
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = new Timestamp(System.currentTimeMillis());
    }

    public String getCpfCnpj() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getCpfCnpj'");
    }
}
