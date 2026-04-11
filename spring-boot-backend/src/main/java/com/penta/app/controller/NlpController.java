package com.penta.app.controller;

import com.penta.app.service.NlpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/nlp")
@CrossOrigin(origins = "*")
public class NlpController {

    @Autowired
    private NlpService nlpService;

    @PostMapping
    public Map<String, Object> processNlp(@RequestBody Map<String, Object> request) {
        return nlpService.processNlp(request);
    }

    @GetMapping("/health")
    public Map<String, Object> getHealth() {
        return nlpService.getHealth();
    }
}
