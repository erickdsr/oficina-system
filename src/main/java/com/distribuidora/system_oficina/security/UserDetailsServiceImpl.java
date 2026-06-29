package com.distribuidora.system_oficina.security;


import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    
    private final EmployeeRepository employeeRepository; 
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Employee employee =  employeeRepository.findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("Employee not found: " + username));
        
            return org.springframework.security.core.userdetails.User
                .withUsername(employee.getEmail())
                .password(employee.getPassword())
                .authorities("ROLE_" + employee.getRole().getName().toUpperCase())
                .build();
    }
}
     


