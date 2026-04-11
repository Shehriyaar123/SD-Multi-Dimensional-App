package com.penta.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class NlpService {

    @Value("${nlp.service.url:http://localhost:5000}")
    private String nlpServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> processNlp(Map<String, Object> request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            return restTemplate.postForObject(nlpServiceUrl + "/process", entity, Map.class);
        } catch (Exception e) {
            return Map.of(
                "error", "Failed to connect to Python NLP service",
                "result", "I'm sorry, my expert neural networks are currently offline. Please try again in a moment."
            );
        }
    }

    public Map<String, Object> getHealth() {
        try {
            return restTemplate.getForObject(nlpServiceUrl + "/health", Map.class);
        } catch (Exception e) {
            return Map.of("status", "offline");
        }
    }
}
