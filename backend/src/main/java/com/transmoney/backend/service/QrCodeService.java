package com.transmoney.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

@Slf4j
@Service
public class QrCodeService {

    private static final String DEFAULT_HMAC_SALT = "TransMoneyDistributedDigitalWalletQRSecretKey2026!";
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record QrPayloadData(
            int version,
            String merchantCode,
            Long accountId,
            BigDecimal amount,
            String currency,
            String orderRef,
            boolean isDynamic,
            Long expiresAtEpochSec,
            String signature
    ) {}

    public String generateSignedPayload(
            String merchantCode,
            Long accountId,
            BigDecimal amount,
            String currency,
            String orderRef,
            boolean isDynamic,
            LocalDateTime expiresAt,
            String secretKey
    ) {
        Long expSec = (isDynamic && expiresAt != null) ? expiresAt.toEpochSecond(ZoneOffset.UTC) : 0L;
        String canonical = buildCanonicalString(merchantCode, accountId, amount, currency, orderRef, expSec);
        String signature = computeHmacSha256(canonical, secretKey != null ? secretKey : DEFAULT_HMAC_SALT);

        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("v", 1);
        map.put("mch", merchantCode);
        map.put("acc", accountId);
        map.put("amt", amount != null ? amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : null);
        map.put("cur", currency != null ? currency : "PKR");
        map.put("ref", orderRef);
        map.put("dyn", isDynamic);
        map.put("exp", expSec);
        map.put("sig", signature);

        try {
            String json = objectMapper.writeValueAsString(map);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize QR payload", e);
        }
    }

    public QrPayloadData parsePayload(String rawPayload) {
        if (rawPayload == null || rawPayload.isBlank()) {
            throw new IllegalArgumentException("QR payload cannot be empty");
        }

        String json;
        String trimmed = rawPayload.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            json = trimmed;
        } else {
            try {
                byte[] decoded = Base64.getUrlDecoder().decode(trimmed);
                json = new String(decoded, StandardCharsets.UTF_8);
            } catch (Exception e) {
                // If not URL base64, try standard base64
                try {
                    byte[] decoded = Base64.getDecoder().decode(trimmed);
                    json = new String(decoded, StandardCharsets.UTF_8);
                } catch (Exception ex) {
                    throw new IllegalArgumentException("Invalid QR payload encoding. Expected Base64 or JSON.");
                }
            }
        }

        try {
            JsonNode node = objectMapper.readTree(json);
            int version = node.has("v") ? node.get("v").asInt() : 1;
            String mch = node.has("mch") ? node.get("mch").asText() : null;
            Long acc = node.has("acc") ? node.get("acc").asLong() : null;
            BigDecimal amt = (node.has("amt") && !node.get("amt").isNull()) ? new BigDecimal(node.get("amt").asText()) : null;
            String cur = node.has("cur") ? node.get("cur").asText() : "PKR";
            String ref = (node.has("ref") && !node.get("ref").isNull()) ? node.get("ref").asText() : null;
            boolean dyn = node.has("dyn") && node.get("dyn").asBoolean();
            Long exp = node.has("exp") ? node.get("exp").asLong() : 0L;
            String sig = node.has("sig") ? node.get("sig").asText() : null;

            return new QrPayloadData(version, mch, acc, amt, cur, ref, dyn, exp, sig);
        } catch (Exception e) {
            throw new IllegalArgumentException("Malformed QR payload structure: " + e.getMessage());
        }
    }

    public boolean verifySignature(QrPayloadData data, String secretKey) {
        if (data.signature() == null || data.signature().isBlank()) {
            return false;
        }
        String canonical = buildCanonicalString(
                data.merchantCode(),
                data.accountId(),
                data.amount(),
                data.currency(),
                data.orderRef(),
                data.expiresAtEpochSec()
        );
        String expected = computeHmacSha256(canonical, secretKey != null ? secretKey : DEFAULT_HMAC_SALT);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                data.signature().getBytes(StandardCharsets.UTF_8)
        );
    }

    public boolean isExpired(QrPayloadData data) {
        if (!data.isDynamic() || data.expiresAtEpochSec() == null || data.expiresAtEpochSec() == 0L) {
            return false;
        }
        long now = Instant.now().getEpochSecond();
        return now > data.expiresAtEpochSec();
    }

    public String renderQrAsDataUrl(String content, int size) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, size, size, hints);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] pngBytes = outputStream.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngBytes);
        } catch (Exception e) {
            log.error("Failed to render QR Code PNG image: {}", e.getMessage(), e);
            return "";
        }
    }

    public String renderQrAsSvg(String content, int size) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, size, size, hints);
            int width = bitMatrix.getWidth();
            int height = bitMatrix.getHeight();

            StringBuilder svg = new StringBuilder();
            svg.append(String.format("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 %d %d\" width=\"100%%\" height=\"100%%\" shape-rendering=\"crispEdges\">", width, height));
            svg.append(String.format("<rect width=\"%d\" height=\"%d\" fill=\"#ffffff\"/>", width, height));
            svg.append("<path fill=\"#0f172a\" d=\"");
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    if (bitMatrix.get(x, y)) {
                        svg.append(String.format("M%d,%dh1v1h-1z ", x, y));
                    }
                }
            }
            svg.append("\"/> </svg>");
            return svg.toString();
        } catch (Exception e) {
            log.error("Failed to render QR Code SVG: {}", e.getMessage(), e);
            return "";
        }
    }

    private String buildCanonicalString(
            String merchantCode,
            Long accountId,
            BigDecimal amount,
            String currency,
            String orderRef,
            Long expSec
    ) {
        return (merchantCode != null ? merchantCode : "") + "|"
                + (accountId != null ? accountId : "") + "|"
                + (amount != null ? amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "STATIC") + "|"
                + (currency != null ? currency.toUpperCase() : "PKR") + "|"
                + (orderRef != null ? orderRef : "") + "|"
                + (expSec != null ? expSec : 0L);
    }

    private String computeHmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hmacBytes.length * 2);
            for (byte b : hmacBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error computing HMAC signature", e);
        }
    }
}
