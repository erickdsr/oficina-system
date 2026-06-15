package com.distribuidora.system_oficina.employee.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.distribuidora.system_oficina.employee.dto.EmployeeRequestDTO;
import com.distribuidora.system_oficina.employee.dto.EmployeeResponseDTO;
import com.distribuidora.system_oficina.employee.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/employees")
@Tag(name = "Employees", description = "Operations related to employees")
public class EmployeeController {
    
    private final EmployeeService employeeService;

    @GetMapping
    @Operation(summary = "List employees", description = "Get a list of all employees")
    public ResponseEntity<List<EmployeeResponseDTO>> listEmployees() {
        return ResponseEntity.ok(employeeService.listEmployees());
    }
    @GetMapping("/{id}")
    @Operation(summary = "Get Employee by ID", description = "Retrieve a Employee by their unique identifier")
    public ResponseEntity<EmployeeResponseDTO> getEmployeeById(@PathVariable Integer id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping
    @Operation(summary = "Create Employee", description = "Create a new Employee")
    public ResponseEntity<EmployeeResponseDTO> createEmployee(@RequestBody @Valid EmployeeRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Employee", description = "Update an existing Employee")
    public ResponseEntity<EmployeeResponseDTO> updateEmployee(@PathVariable Integer id, @RequestBody @Valid EmployeeRequestDTO dto) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Employee", description = "Delete a Employee by their unique identifier")
    public ResponseEntity<String> deleteEmployee(@PathVariable Integer id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
}

