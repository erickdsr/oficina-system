package com.distribuidora.system_oficina.security;

import java.security.Timestamp;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.distribuidora.system_oficina.role.entity.Role;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "employees")
public class UserDeatailsServiceImpl implements UserDetails {
     
    private Integer id;
    private Role role;
    private Boolean status;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private String cpf;
    private String phone;
    private String email;
    private String name;
    private String password;

    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
    
        throw new UnsupportedOperationException("Unimplemented method 'getAuthorities'");
    }
    @Override
    public String getUsername() {
   
        throw new UnsupportedOperationException("Unimplemented method 'getUsername'");
    }

}
