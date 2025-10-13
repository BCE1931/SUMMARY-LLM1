package com.example.demo.services;

import com.example.demo.models.Users1;
import com.example.demo.repository.Users1_repo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class Users1_Service {

    @Autowired
    private Users1_repo repo;

    public ResponseEntity<?> signup(Users1 users1) {
        Users1 user = new Users1();
        if(repo.existsByUsername(users1.getUsername())){
            return ResponseEntity.ok(Map.of("message", "username already exists"));
        }
        user.setUsername(users1.getUsername());
        user.setPassword(users1.getPassword());
        user.setEmail(users1.getEmail());
        repo.save(user);
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    public ResponseEntity<?> login(Users1 users1) {
        if(repo.existsByUsername(users1.getUsername())){
            Users1 user = repo.getByUsername(users1.getUsername());
            if(user.getPassword().equals(users1.getPassword())){
                return ResponseEntity.ok(Map.of("message", "ok"));
            }
            else{
                return ResponseEntity.ok(Map.of("message", "username or password do not match"));
            }
        }
        return  ResponseEntity.ok(Map.of("message", "username or password do not match"));
    }
}
