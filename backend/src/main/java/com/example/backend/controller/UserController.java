package com.example.backend.controller;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import com.mongodb.client.gridfs.GridFSBucket;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class UserController {
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GridFSBucket gridFSBucket;

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
        try {
            User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            userRepository.save(user);
                   
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<Map<String, Object>>> getSuggestedUsers() {
        try {
            List<User> users = userRepository.findAll();
            
            List<Map<String, Object>> suggestedUsers = users.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("firstName", user.getFirstName());
                    userMap.put("lastName", user.getLastName());
                    userMap.put("email", user.getEmail());
                    userMap.put("profilePicture", user.getProfilePicture());
                    userMap.put("bio", user.getBio());
                    userMap.put("followers", user.getFollowers() != null ? user.getFollowers().size() : 0);
                    return userMap;
                })
                .limit(10)
                .collect(Collectors.toList());

            return ResponseEntity.ok(suggestedUsers);
        } catch (Exception e) {
            logger.error("Error fetching suggested users: ", e);
            return ResponseEntity.status(500).body(Collections.emptyList());
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
            Set<String> followers = userToFollow.getFollowers();
            if (followers == null) {
                followers = Collections.emptySet();
            }
            
            followers.add(followerId);
            userToFollow.setFollowers(followers);
            userRepository.save(userToFollow);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{userId}/bio")
    public ResponseEntity<?> updateBio(@PathVariable String userId, @RequestBody UpdateBioRequest request) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setBio(request.getBio());
            userRepository.save(user);
            return ResponseEntity.ok(Collections.singletonMap("bio", user.getBio()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{userId}/bio")
    public ResponseEntity<?> getBio(@PathVariable String userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok().body(Collections.singletonMap("bio", user.getBio()));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}

class ProfilePictureResponse {
    private String url;

    public ProfilePictureResponse(String url) {
        this.url = url;
    }

    public String getUrl() {
        return url;
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

class UpdateBioRequest {
    private String bio;

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
