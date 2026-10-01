package com.transmoney.backend.controller;

import com.transmoney.backend.dto.request.LoginRequest;
import com.transmoney.backend.dto.request.RegisterRequest;
import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.dto.response.AuthResponse;
import com.transmoney.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication & Identity", description = "Secure user registration, credential verification, and JWT session issuing")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new user with wallet account", description = "Creates a user profile, encrypts password using BCrypt, provisions an initial shard account, and returns a signed JWT token.")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User registered successfully", response));
    }

    @Operation(summary = "User Login", description = "Verifies email and password credentials, returning a signed JWT token and user profile.")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @Operation(summary = "Get Current User Profile & Accounts", description = "Validates the Bearer token and returns the current user profile with active shard accounts.")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthResponse response = authService.getMe(authHeader);
        return ResponseEntity.ok(ApiResponse.ok("User profile retrieved successfully", response));
    }
}
