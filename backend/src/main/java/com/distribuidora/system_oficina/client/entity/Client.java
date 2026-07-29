package com.distribuidora.system_oficina.client.entity;

import java.sql.Timestamp;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
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

    @Column(name = "secondary_phone", length = 20)
    private String secondaryPhone;
    
    @Column(name = "cpf_cnpj", nullable = false, length = 20)
    private String cpfCnpj;
    
    @Column(name = "client_type", nullable = false, length = 10)
    private String clientType;
    
    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "zip_code", length = 8)
    private String zipCode;

    @Column(name = "street", length = 150)
    private String street;

    @Column(name = "number", length = 20)
    private String number;

    @Column(name = "complement", length = 120)
    private String complement;

    @Column(name = "district", length = 100)
    private String district;
    
    @Column(name = "city", length = 150)
    private String city;
    
    @Column(name = "state", length = 2)
    private String state;
    
    @Column(name = "status", nullable = false)
    private Boolean status = true;

    @Column(name = "notes", length = 1000)
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private Timestamp createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Timestamp updatedAt;

}
