package com.transmoney.backend.service;

import com.transmoney.backend.dto.request.FxQuoteRequest;
import com.transmoney.backend.dto.response.FxQuoteResponse;
import com.transmoney.backend.dto.response.FxRatesResponse;
import com.transmoney.backend.exception.TransactionException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class FxRateService {

    // Default institutional spread margin: 0.35%
    public static final BigDecimal DEFAULT_SPREAD_PERCENT = new BigDecimal("0.35");
    public static final long QUOTE_VALIDITY_SECONDS = 60;

    // Supported multi-currency portfolio: USD, EUR, GBP, AED, PKR
    private final Map<String, BigDecimal> ratesAgainstUsd = new ConcurrentHashMap<>();
    private final Map<String, CachedQuote> quoteCache = new ConcurrentHashMap<>();

    public FxRateService() {
        initDefaultRates();
    }

    private void initDefaultRates() {
        // Base currency: USD (1.000000)
        ratesAgainstUsd.put("USD", new BigDecimal("1.000000"));
        ratesAgainstUsd.put("EUR", new BigDecimal("0.920000"));      // 1 USD = 0.92 EUR (1 EUR = 1.086957 USD)
        ratesAgainstUsd.put("GBP", new BigDecimal("0.780000"));      // 1 USD = 0.78 GBP (1 GBP = 1.282051 USD)
        ratesAgainstUsd.put("AED", new BigDecimal("3.672500"));      // 1 USD = 3.6725 AED (1 AED = 0.272294 USD)
        ratesAgainstUsd.put("PKR", new BigDecimal("278.500000"));    // 1 USD = 278.50 PKR (1 PKR = 0.003591 USD)
    }

    public List<String> getSupportedCurrencies() {
        return List.of("USD", "EUR", "GBP", "AED", "PKR");
    }

    public boolean isSupported(String currency) {
        return currency != null && ratesAgainstUsd.containsKey(currency.trim().toUpperCase());
    }

    /**
     * Calculates the direct interbank cross-rate from sourceCurrency to targetCurrency.
     * Rate = RateAgainstUSD(target) / RateAgainstUSD(source)
     */
    public BigDecimal calculateMarketRate(String sourceCurrency, String targetCurrency) {
        String src = validateCurrency(sourceCurrency);
        String tgt = validateCurrency(targetCurrency);

        if (src.equalsIgnoreCase(tgt)) {
            return BigDecimal.ONE.setScale(6, RoundingMode.HALF_UP);
        }

        BigDecimal srcUsdRate = ratesAgainstUsd.get(src);
        BigDecimal tgtUsdRate = ratesAgainstUsd.get(tgt);

        if (srcUsdRate == null || tgtUsdRate == null) {
            throw new IllegalArgumentException("Unsupported currency conversion pair: " + src + " -> " + tgt);
        }

        return tgtUsdRate.divide(srcUsdRate, 6, RoundingMode.HALF_UP);
    }

    /**
     * Returns full live rates snapshot including key direct currency pairs.
     */
    public FxRatesResponse getLiveRates() {
        cleanExpiredQuotes();

        Map<String, BigDecimal> pairs = new LinkedHashMap<>();
        pairs.put("USD/PKR", calculateMarketRate("USD", "PKR"));
        pairs.put("EUR/USD", calculateMarketRate("EUR", "USD"));
        pairs.put("GBP/USD", calculateMarketRate("GBP", "USD"));
        pairs.put("USD/AED", calculateMarketRate("USD", "AED"));
        pairs.put("EUR/PKR", calculateMarketRate("EUR", "PKR"));
        pairs.put("GBP/PKR", calculateMarketRate("GBP", "PKR"));
        pairs.put("AED/PKR", calculateMarketRate("AED", "PKR"));

        return FxRatesResponse.builder()
                .baseCurrency("USD")
                .timestamp(LocalDateTime.now())
                .defaultSpreadPercent(DEFAULT_SPREAD_PERCENT)
                .supportedCurrencies(getSupportedCurrencies())
                .ratesAgainstUsd(new LinkedHashMap<>(ratesAgainstUsd))
                .directPairs(pairs)
                .build();
    }

    /**
     * Generates an official, locked 60-second FX conversion quote with transparent spread fee.
     */
    public FxQuoteResponse generateQuote(FxQuoteRequest request) {
        String src = validateCurrency(request.getSourceCurrency());
        String tgt = validateCurrency(request.getTargetCurrency());
        BigDecimal amount = request.getAmount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quote amount must be strictly positive");
        }

        BigDecimal marketRate = calculateMarketRate(src, tgt);
        BigDecimal grossTarget = amount.multiply(marketRate).setScale(4, RoundingMode.HALF_UP);

        BigDecimal spreadFee = grossTarget.multiply(DEFAULT_SPREAD_PERCENT)
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        BigDecimal netTarget = grossTarget.subtract(spreadFee).setScale(2, RoundingMode.HALF_UP);
        BigDecimal effectiveRate = netTarget.divide(amount, 6, RoundingMode.HALF_UP);

        // Standard slippage limit (0.5% buffer)
        BigDecimal minGuaranteed = netTarget.multiply(new BigDecimal("0.995")).setScale(2, RoundingMode.HALF_DOWN);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(QUOTE_VALIDITY_SECONDS);
        String quoteId = "QUOTE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        CachedQuote cached = new CachedQuote(
                quoteId, src, tgt, amount, marketRate, effectiveRate,
                DEFAULT_SPREAD_PERCENT, spreadFee.setScale(2, RoundingMode.HALF_UP),
                grossTarget.setScale(2, RoundingMode.HALF_UP), netTarget, minGuaranteed, expiresAt
        );
        quoteCache.put(quoteId, cached);

        log.info("Generated FX quote [{}] for {} {} -> {} {} (marketRate={}, effectiveRate={})",
                quoteId, amount, src, netTarget, tgt, marketRate, effectiveRate);

        return FxQuoteResponse.builder()
                .quoteId(quoteId)
                .sourceCurrency(src)
                .targetCurrency(tgt)
                .sourceAmount(amount.setScale(2, RoundingMode.HALF_UP))
                .marketRate(marketRate)
                .effectiveRate(effectiveRate)
                .spreadMarginPercent(DEFAULT_SPREAD_PERCENT)
                .spreadFeeAmount(spreadFee.setScale(2, RoundingMode.HALF_UP))
                .grossTargetAmount(grossTarget.setScale(2, RoundingMode.HALF_UP))
                .netTargetAmount(netTarget)
                .minGuaranteedAmount(minGuaranteed)
                .issuedAt(now)
                .expiresAt(expiresAt)
                .validitySeconds(QUOTE_VALIDITY_SECONDS)
                .build();
    }

    /**
     * Converts an amount and rigorously asserts slippage boundaries.
     */
    public ConversionResult executeConversion(
            String sourceCurrency,
            String targetCurrency,
            BigDecimal sourceAmount,
            String quoteId,
            BigDecimal expectedRate,
            BigDecimal minTargetAmount,
            BigDecimal maxSlippagePercent
    ) {
        String src = validateCurrency(sourceCurrency);
        String tgt = validateCurrency(targetCurrency);

        if (src.equalsIgnoreCase(tgt)) {
            return new ConversionResult(sourceAmount, BigDecimal.ONE, BigDecimal.ZERO, DEFAULT_SPREAD_PERCENT);
        }

        BigDecimal marketRate;
        BigDecimal effectiveRate;
        BigDecimal netTargetAmount;
        BigDecimal feeAmount;

        // Check if locked quote was provided
        if (quoteId != null && quoteCache.containsKey(quoteId)) {
            CachedQuote quote = quoteCache.get(quoteId);
            if (quote.expiresAt().isAfter(LocalDateTime.now())
                    && quote.sourceCurrency().equalsIgnoreCase(src)
                    && quote.targetCurrency().equalsIgnoreCase(tgt)) {
                marketRate = quote.marketRate();
                effectiveRate = quote.effectiveRate();
                feeAmount = quote.spreadFee();
                // Pro-rate if requested amount differs from quoted amount
                if (sourceAmount.compareTo(quote.sourceAmount()) == 0) {
                    netTargetAmount = quote.netTargetAmount();
                } else {
                    BigDecimal gross = sourceAmount.multiply(marketRate).setScale(4, RoundingMode.HALF_UP);
                    feeAmount = gross.multiply(DEFAULT_SPREAD_PERCENT).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    netTargetAmount = gross.subtract(feeAmount).setScale(2, RoundingMode.HALF_UP);
                }
            } else {
                throw new TransactionException("FX Quote " + quoteId + " has expired or has mismatched currency pair. Please request a fresh quote.");
            }
        } else {
            marketRate = calculateMarketRate(src, tgt);
            BigDecimal gross = sourceAmount.multiply(marketRate).setScale(4, RoundingMode.HALF_UP);
            feeAmount = gross.multiply(DEFAULT_SPREAD_PERCENT).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            netTargetAmount = gross.subtract(feeAmount).setScale(2, RoundingMode.HALF_UP);
            effectiveRate = netTargetAmount.divide(sourceAmount, 6, RoundingMode.HALF_UP);
        }

        // --- Slippage and Floor Assertions ---
        if (minTargetAmount != null && netTargetAmount.compareTo(minTargetAmount) < 0) {
            throw new TransactionException(String.format(
                    "Slippage boundary violation: converted amount %s %s is lower than minimum acceptable %s %s",
                    netTargetAmount, tgt, minTargetAmount, tgt
            ));
        }

        if (expectedRate != null && maxSlippagePercent != null && maxSlippagePercent.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal minAllowedRate = expectedRate.multiply(BigDecimal.ONE.subtract(
                    maxSlippagePercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
            ));
            if (effectiveRate.compareTo(minAllowedRate) < 0) {
                throw new TransactionException(String.format(
                        "Rate slippage threshold exceeded: effective rate %s is below expected rate %s minus %s%% slippage",
                        effectiveRate, expectedRate, maxSlippagePercent
                ));
            }
        }

        return new ConversionResult(netTargetAmount, effectiveRate, feeAmount, DEFAULT_SPREAD_PERCENT);
    }

    private String validateCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("Currency must not be blank");
        }
        String clean = currency.trim().toUpperCase();
        if (!ratesAgainstUsd.containsKey(clean)) {
            throw new IllegalArgumentException("Unsupported currency [" + clean + "]. Supported: " + getSupportedCurrencies());
        }
        return clean;
    }

    private void cleanExpiredQuotes() {
        LocalDateTime now = LocalDateTime.now();
        quoteCache.entrySet().removeIf(e -> e.getValue().expiresAt().isBefore(now));
    }

    public record CachedQuote(
            String quoteId,
            String sourceCurrency,
            String targetCurrency,
            BigDecimal sourceAmount,
            BigDecimal marketRate,
            BigDecimal effectiveRate,
            BigDecimal spreadPercent,
            BigDecimal spreadFee,
            BigDecimal grossTargetAmount,
            BigDecimal netTargetAmount,
            BigDecimal minGuaranteed,
            LocalDateTime expiresAt
    ) {}

    public record ConversionResult(
            BigDecimal targetAmount,
            BigDecimal effectiveRate,
            BigDecimal feeAmount,
            BigDecimal spreadPercent
    ) {}
}
