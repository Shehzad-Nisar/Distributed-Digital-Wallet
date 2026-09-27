package com.transmoney.backend.dto.request;

import com.transmoney.backend.entity.enums.ShardType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAccountRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotBlank(message = "Currency is required")
    @Builder.Default
    private String currency = "PKR";

    @DecimalMin(value = "0.0", inclusive = true, message = "Initial balance cannot be negative")
    @Builder.Default
    private BigDecimal initialBalance = BigDecimal.ZERO;

    @NotNull(message = "Shard is required")
    private ShardType shard;
}
