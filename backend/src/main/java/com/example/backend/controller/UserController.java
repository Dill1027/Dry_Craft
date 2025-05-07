package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import com.mongodb.client.gridfs.GridFSBucket;

import java.util.*;
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
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> suggestions = users.stream()
            .map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("name", user.getFirstName() + " " + user.getLastName());
                userMap.put("profilePicture", user.getProfilePicture());
                return userMap;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(suggestions);
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

    @GetMapping("/{userId}/followers")
    public ResponseEntity<List<Map<String, Object>>> getUserFollowers(@PathVariable String userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Map<String, Object>> followers = new ArrayList<>();
            if (user.getFollowers() != null) {
                user.getFollowers().forEach(followerId -> {
                    userRepository.findById(followerId).ifPresent(follower -> {
                        Map<String, Object> followerInfo = new HashMap<>();
                        followerInfo.put("id", follower.getId());
                        followerInfo.put("name", follower.getFirstName() + " " + follower.getLastName());
                        followerInfo.put("profilePicture", follower.getProfilePicture());
                        followers.add(followerInfo);
                    });
                });
            }
            return ResponseEntity.ok(followers);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserProfile(@PathVariable String userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("email", user.getEmail());
            response.put("bio", user.getBio());
            response.put("profilePicture", user.getProfilePicture());
            response.put("followers", user.getFollowers() != null ? user.getFollowers().size() : 0);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "An error occurred while fetching user data");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
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
