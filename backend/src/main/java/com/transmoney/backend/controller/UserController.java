package com.transmoney.backend.controller;

import com.transmoney.backend.dto.request.CreateUserRequest;
import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "User Management", description = "Endpoints for creating and retrieving wallet user profiles")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "Register a new user", description = "Creates a new user profile with unique email and phone number.")
    @PostMapping
    public ResponseEntity<ApiResponse<User>> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User registered successfully", user));
    }

    @Operation(summary = "Get user by ID", description = "Retrieves user profile information by internal user ID.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@Parameter(description = "User ID") @PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @Operation(summary = "List all users", description = "Retrieves all registered wallet users.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }
}

