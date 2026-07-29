package com.distribuidora.system_oficina.client.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import com.distribuidora.system_oficina.client.dto.ClientDetailsResponseDTO;
import com.distribuidora.system_oficina.client.dto.ClientListResponseDTO;
import com.distribuidora.system_oficina.client.dto.ClientRequestDTO;
import com.distribuidora.system_oficina.client.dto.ClientSummaryResponseDTO;
import com.distribuidora.system_oficina.client.service.ClientService;
import com.distribuidora.system_oficina.deletion.DeletionReportDTO;
import com.distribuidora.system_oficina.deletion.DeletionResultDTO;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequiredArgsConstructor
@RequestMapping("/clients")
@Tag(name = "Clients", description = "Client management endpoints")
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    @Operation(summary = "List all clients", description = "Returns all registered clients")
    public ResponseEntity<List<ClientListResponseDTO>> listClients(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(clientService.listClients(includeInactive));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get client summary", description = "Returns client totals grouped by status")
    public ResponseEntity<ClientSummaryResponseDTO> getClientSummary() {
        return ResponseEntity.ok(clientService.getClientSummary());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get client by ID", description = "Returns the client matching the provided identifier")
    public ResponseEntity<ClientDetailsResponseDTO> getClientById(@PathVariable Integer id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new client", description = "Creates a new client record with the provided details")
    public ResponseEntity<ClientDetailsResponseDTO> createClient(@RequestBody @Valid ClientRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clientService.createClient(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing client", description = "Updates the client information for the specified identifier")
    public ResponseEntity<ClientDetailsResponseDTO> updateClient(@PathVariable Integer id, @RequestBody @Valid ClientRequestDTO dto) {
        return ResponseEntity.ok(clientService.updateClient(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a client", description = "Deletes the client identified by the provided ID")
    public ResponseEntity<DeletionResultDTO> deleteClient(@PathVariable Integer id) {
        return ResponseEntity.ok(clientService.deleteClient(id));
    }

    @DeleteMapping("/{id}/force")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Force delete a client", description = "Deletes the client and its dependent records")
    public ResponseEntity<DeletionResultDTO> forceDeleteClient(@PathVariable Integer id) {
        return ResponseEntity.ok(clientService.forceDeleteClient(id));
    }

    @GetMapping("/{id}/deletion-report")
    @Operation(summary = "Get client deletion report", description = "Returns the dependencies that affect client deletion")
    public ResponseEntity<DeletionReportDTO> getDeletionReport(@PathVariable Integer id) {
        return ResponseEntity.ok(clientService.getDeletionReport(id));
    }
}
