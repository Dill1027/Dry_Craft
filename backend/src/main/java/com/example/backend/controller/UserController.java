package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import com.mongodb.client.gridfs.GridFSBucket;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class UserController {
    private final UserService userService;
    private final GridFSBucket gridFSBucket;

    @Autowired
    private UserRepository userRepository;

    public UserController(UserService userService, GridFSBucket gridFSBucket) {
        this.userService = userService;
        this.gridFSBucket = gridFSBucket;
    }

    @PutMapping("/{userId}/profile-picture")
    public ResponseEntity<?> updateProfilePicture(
            @PathVariable String userId,
            @RequestParam("image") MultipartFile image) {
        try {
            String profilePicture = userService.updateProfilePicture(userId, image);
            return ResponseEntity.ok().body(new ProfilePictureResponse(profilePicture));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{userId}/profile-picture")
    public ResponseEntity<?> getProfilePicture(@PathVariable String userId) {
        try {
            String profilePicture = userService.getProfilePicture(userId);
            return ResponseEntity.ok().body(new ProfilePictureResponse(profilePicture));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/update-name")
    public ResponseEntity<?> updateName(@RequestBody UpdateNameRequest request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        userRepository.save(user);
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/suggestions") 
    public ResponseEntity<List<Map<String, Object>>> getSuggestedUsers() {
        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> processedUsers = users.stream()
                .map(user -> {
                    Map<String, Object> processedUser = new HashMap<>();
                    processedUser.put("id", user.getId());
                    processedUser.put("firstName", user.getFirstName());
                    processedUser.put("lastName", user.getLastName());
                    processedUser.put("email", user.getEmail());
                    processedUser.put("profilePicture", user.getProfilePicture());
                    return processedUser;
                })
                .collect(Collectors.toList());
            return ResponseEntity.ok(processedUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<?> followUser(@PathVariable String userId, @RequestBody Map<String, String> body) {
        try {
            String followerId = body.get("followerId");
            if (followerId == null) {
                return ResponseEntity.badRequest().body("Follower ID is required");
            }
            
            User userToFollow = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            User follower = userRepository.findById(followerId)
                    .orElseThrow(() -> new RuntimeException("Follower not found"));
            
            Set<String> followers = userToFollow.getFollowers();
            if (followers == null) {
                followers = new HashSet<>();
            }
            
            followers.add(followerId);
            userToFollow.setFollowers(followers);
            userRepository.save(userToFollow);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

class ProfilePictureResponse {
    private String profilePicture;

    public ProfilePictureResponse(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }
}

class UpdateNameRequest {
    private String firstName;
    private String lastName;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
}
