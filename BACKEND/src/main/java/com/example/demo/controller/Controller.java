package com.example.demo.controller;


import com.example.demo.models.Users1;
import com.example.demo.services.Users1_Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class Controller {


    @Autowired
    private Users1_Service users1_Service;

    @PostMapping("/signup")
    private ResponseEntity<?> signup(@RequestBody Users1 users1) {
        return users1_Service.signup(users1);
    }

    @PostMapping("/login")
    private ResponseEntity<?> login(@RequestBody Users1 users1) {
        return users1_Service.login(users1);
    }

//    @GetMapping("/sendotp/{email}")
//    public ResponseEntity<?> sendotp(@PathVariable String email) {
//        return otpService.sendotp(email);
//    }
//
//    @PostMapping("/validateotp")
//    public ResponseEntity<?> validateotp(@RequestBody Otp otp) {
//        return otpService.validateotp(otp);
//    }

//    @PostMapping("/upload")
//    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
//        // process file with ASR + LLM
//        System.out.println(file.getOriginalFilename());
//        return ResponseEntity.ok(Map.of("summary", "Your summarized output text"));
//    }

}
