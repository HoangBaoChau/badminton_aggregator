package com.badminton.ecommerce.modules.deal.service;

import com.badminton.ecommerce.modules.deal.dto.response.AiFilterResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiFilterService {

    @Value("${ai.groq.api-key}")
    private String groqApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL_NAME = "llama3-8b-8192"; // Model siêu nhanh của Groq

    private static final String SYSTEM_PROMPT = """
            Bạn là AI trích xuất bộ lọc tìm kiếm cho website bán đồ cầu lông.
            Nhiệm vụ: Phân tích câu nói của người dùng và trả về ĐÚNG MỘT OBJECT JSON chứa các trường sau (nếu không có thì để null):
            - keyword (string): Các từ khóa tìm kiếm còn lại (không bao gồm hãng, loại sản phẩm).
            - productType (string): Chỉ được chọn 1 trong: "vợt", "giày", "quần áo", "balo túi", "cầu", "phụ kiện".
            - brand (string): Chỉ được chọn 1 trong: "yonex", "victor", "lining", "mizuno", "apacs", "kumpoo".
            - location (string): Tên địa điểm (vd: "Cầu Giấy", "Hà Nội").
            - transactionMethod (string): "cod" (nếu có nhắc đến ship cod, chuyển phát), "gdtt" (giao dịch trực tiếp, gdtt, xem trực tiếp), "trade" (giao lưu, đổi).
            - condition (string): "new" (mới 100%), "likenew" (như mới, 99%), "used" (cũ, đã qua sử dụng).
            - minPrice (number): Giá tối thiểu bằng VNĐ (vd: 1 triệu -> 1000000).
            - maxPrice (number): Giá tối đa bằng VNĐ.

            CHÚ Ý QUAN TRỌNG:
            - Chỉ trả về ĐÚNG chuỗi JSON hợp lệ, không Markdown, không giải thích, không bọc trong ```json ```.
            - Ví dụ input: "tìm vợt lining cũ tầm 1 củ rưỡi ở cầu giấy gdtt"
            - Output: {"keyword":"","productType":"vợt","brand":"lining","location":"Cầu Giấy","transactionMethod":"gdtt","condition":"used","minPrice":null,"maxPrice":1500000}
            """;

    @Cacheable(value = "ai_filters", key = "#query")
    public AiFilterResponse extractFilters(String query) {
        log.info("Extracting AI filters for query: {}", query);
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            Map<String, Object> requestBody = Map.of(
                    "model", MODEL_NAME,
                    "messages", List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of("role", "user", "content", query)),
                    "temperature", 0.0,
                    "response_format", Map.of("type", "json_object"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            Map<String, Object> response = restTemplate.postForObject(GROQ_API_URL, entity, Map.class);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");

                    // Parse chuỗi JSON do LLM sinh ra thành đối tượng DTO
                    return objectMapper.readValue(content, AiFilterResponse.class);
                }
            }

            log.warn("Groq API returned unexpected format. Fallback activated.");
            return AiFilterResponse.fallback(query);

        } catch (Exception e) {
            log.error("Error calling AI API. Fallback activated. Error: {}", e.getMessage());
            return AiFilterResponse.fallback(query);
        }
    }
}
