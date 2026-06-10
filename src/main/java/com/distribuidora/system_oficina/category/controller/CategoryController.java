package com.distribuidora.system_oficina.category.controller;


import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/Categories")
public class CategoryController {

    @GetMapping
    public String name() {
        return "API funcionando";
    }

}