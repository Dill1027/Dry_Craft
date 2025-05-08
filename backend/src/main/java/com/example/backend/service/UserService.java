package com.example.backend.service;

import java.io.IOException;
import java.util.logging.Logger;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final GridFSBucket gridFSBucket;
    private final Logger logger = Logger.getLogger(UserService.class.getName());

    public UserService(UserRepository userRepository, GridFSBucket gridFSBucket) {
        this.userRepository = userRepository;
        this.gridFSBucket = gridFSBucket;
    }

    public String updateProfilePicture(String userId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        // Validate file size (5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be less than 5MB");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            // Delete old profile picture if exists
            if (user.getProfilePicture() != null) {
                String oldMediaId = user.getProfilePicture().replace("/api/media/", "");
                try {
                    gridFSBucket.delete(new ObjectId(oldMediaId));
                } catch (Exception e) {
                    // Log the error but continue with the update
                    logger.warning("Failed to delete old profile picture: " + e.getMessage());
                }
            }

            // Save new profile picture with metadata
            GridFSUploadOptions options = new GridFSUploadOptions()
                    .metadata(new Document("type", "profile")
                            .append("userId", userId)
                            .append("contentType", contentType));
            
            ObjectId fileId = gridFSBucket.uploadFromStream(
                    file.getOriginalFilename(),
                    file.getInputStream(),
                    options);

            String profilePicture = "/api/media/" + fileId.toString();
            user.setProfilePicture(profilePicture);
            userRepository.save(user);

            return profilePicture;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update profile picture: " + e.getMessage());
        }
    }

    public String getProfilePicture(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getProfilePicture();
    }

    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
