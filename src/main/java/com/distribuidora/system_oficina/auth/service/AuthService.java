package com.distribuidora.system_oficina.auth.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.distribuidora.system_oficina.auth.dto.LoginRequestDTO;
import com.distribuidora.system_oficina.auth.dto.LoginResponseDTO;
import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmployeeRepository employeeRepository;

    public LoginResponseDTO authenticate(LoginRequestDTO request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = jwtService.generateToken(authentication.getPrincipal());
        Employee employee = employeeRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        return new LoginResponseDTO(
                token,
                "Bearer",
                employee.getId(),
                employee.getRole().getName(),
                employee.getName()
        );
    }
}
