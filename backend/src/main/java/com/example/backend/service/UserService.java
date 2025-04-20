package com.example.backend.service;

import java.io.IOException;

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

    public UserService(UserRepository userRepository, GridFSBucket gridFSBucket) {
        this.userRepository = userRepository;
        this.gridFSBucket = gridFSBucket;
    }

    public String updateProfilePicture(String userId, MultipartFile file) throws IOException {
        if (!file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete old profile picture if exists
        if (user.getProfilePicture() != null) {
            String oldMediaId = user.getProfilePicture().replace("/api/media/", "");
            try {
                gridFSBucket.delete(new ObjectId(oldMediaId));
            } catch (Exception e) {
                // Ignore if old file doesn't exist
            }
        }

        // Save new profile picture
        GridFSUploadOptions options = new GridFSUploadOptions()
                .metadata(new org.bson.Document("type", "profile"));
        
        ObjectId fileId = gridFSBucket.uploadFromStream(
                file.getOriginalFilename(),
                file.getInputStream(),
                options);

        String profilePicture = "/api/media/" + fileId.toString();
        user.setProfilePicture(profilePicture);
        userRepository.save(user);

        return profilePicture;
    }

    public String getProfilePicture(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getProfilePicture();
    }
}
