package com.transmoney.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "System Health", description = "Liveness and readiness probes for load balancers and system monitoring")
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Operation(summary = "Check backend and database health", description = "Verifies Spring Boot application responsiveness and live PostgreSQL connection pool status.")
    @GetMapping
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "TransMoney Digital Wallet Backend");

        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                health.put("database", "Connected (PostgreSQL)");
            } else {
                health.put("database", "Unreachable");
            }
        } catch (Exception e) {
            health.put("database", "Error: " + e.getMessage());
        }

        return ResponseEntity.ok(health);
    }
}
