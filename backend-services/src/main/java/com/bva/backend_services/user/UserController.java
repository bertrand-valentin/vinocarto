package com.bva.backend_services.user;

import com.bva.persistence.entities.User;
import com.bva.vinocarto_core.model.UserDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserDto dto) {
        try {
            User createdUser = userService.createUser(dto.getLogin(), dto.getPassword());
            String token = userService.generateJwtToken(createdUser);
            return ResponseEntity.ok(new LoginResponse(token, createdUser.getId(), dto.getLogin()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserDto dto) {
        try {
            User existingUser = userService.login(dto.getLogin(), dto.getPassword());
            String token = userService.generateJwtToken(existingUser);
            return ResponseEntity.ok(new LoginResponse(token, existingUser.getId(), dto.getLogin()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok("Profile for: " + auth.getName());
    }

    record LoginResponse(String token, long id, String login) {}
}