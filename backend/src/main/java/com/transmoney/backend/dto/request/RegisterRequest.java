package com.transmoney.backend.dto.request;

import com.transmoney.backend.entity.enums.ShardType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @Schema(description = "Full name of the wallet holder", example = "Hamza Ali")
    @NotBlank(message = "Full name is required")
    private String fullName;

    @Schema(description = "Email address for login", example = "hamza@transmoney.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Schema(description = "Secure password (min 6 characters)", example = "SecurePass123!")
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @Schema(description = "Contact phone number", example = "+923001234567")
    private String phoneNumber;

    @Schema(description = "Initial regional database shard", example = "SHARD_1_US")
    private ShardType shard;

    @Schema(description = "Initial deposit amount (optional, defaults to 0.00)", example = "2500.00")
    private BigDecimal initialBalance;

    @Schema(description = "Account currency (optional, defaults to PKR or USD)", example = "PKR")
    private String currency;
}
