package com.distribuidora.system_oficina.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.distribuidora.system_oficina.auth.dto.LoginRequestDTO;
import com.distribuidora.system_oficina.auth.dto.LoginResponseDTO;
import com.distribuidora.system_oficina.auth.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {
        return authService.authenticate(request);
    }
}
