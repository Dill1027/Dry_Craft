package com.example.backend.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.Tutorial;
import com.example.backend.model.UserProgress;
import com.example.backend.repository.TutorialRepository;
import com.example.backend.repository.UserProgressRepository;
import com.example.backend.repository.UserRepository;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;

@Service
public class TutorialService {
    private final TutorialRepository tutorialRepository;
    private final UserRepository userRepository;
    private final GridFSBucket gridFSBucket;
    private final MediaService mediaService;

    @Autowired
    private UserProgressRepository userProgressRepository;

    private static final int MAX_VIDEO_SIZE_MB = 50; // Increased to 50MB
    private static final List<String> ALLOWED_VIDEO_TYPES = List.of("video/mp4", "video/quicktime");

    @Autowired
    public TutorialService(
            TutorialRepository tutorialRepository,
            UserRepository userRepository,
            MongoTemplate mongoTemplate,
            MediaService mediaService) {
        this.tutorialRepository = tutorialRepository;
        this.userRepository = userRepository;
        this.gridFSBucket = GridFSBuckets.create(mongoTemplate.getDb(), "media");
        this.mediaService = mediaService;
    }

    public List<Tutorial> getAllTutorials() {
        try {
            return tutorialRepository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching tutorials: " + e.getMessage());
        }
    }

    public Tutorial getTutorialById(String id) {
        return tutorialRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tutorial not found with id: " + id));
    }

    public Tutorial createTutorial(String userId, String title, String description, 
                                 List<String> steps, List<String> materials,
                                 MultipartFile video, List<MultipartFile> images) throws IOException {
        // Validate user exists
        userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Tutorial tutorial = new Tutorial();
        tutorial.setUserId(userId);
        tutorial.setTitle(title);
        tutorial.setDescription(description);
        tutorial.setSteps(steps != null ? steps : new ArrayList<>());
        tutorial.setMaterials(materials != null ? materials : new ArrayList<>());
        tutorial.setCreatedAt(LocalDateTime.now());

        List<String> mediaIds = new ArrayList<>();

        try {
            // Handle video upload
            if (video != null && !video.isEmpty()) {
                validateVideo(video);
                String videoId = mediaService.saveMedia(video, "video");
                mediaIds.add(videoId);
                tutorial.setVideoUrl("/api/media/" + videoId);
            }

            // Handle image uploads
            if (images != null && !images.isEmpty()) {
                List<String> imageUrls = new ArrayList<>();
                for (MultipartFile image : images) {
                    if (!image.getContentType().startsWith("image/")) {
                        throw new IllegalArgumentException("Only image files are supported");
                    }
                    String imageId = mediaService.saveMedia(image, "image");
                    mediaIds.add(imageId);
                    imageUrls.add("/api/media/" + imageId);
                }
                tutorial.setImageUrls(imageUrls);
            }

            tutorial.setMediaIds(mediaIds);
            return tutorialRepository.save(tutorial);
        } catch (Exception e) {
            // Clean up any uploaded media if tutorial creation fails
            mediaIds.forEach(id -> {
                try {
                    gridFSBucket.delete(new org.bson.types.ObjectId(id));
                } catch (Exception ex) {
                    // Log error but don't throw
                    System.err.println("Error cleaning up media: " + ex.getMessage());
                }
            });
            throw new RuntimeException("Failed to create tutorial: " + e.getMessage());
        }
    }

    private void validateVideo(MultipartFile video) {
        if (!ALLOWED_VIDEO_TYPES.contains(video.getContentType())) {
            throw new IllegalArgumentException(
                    "Invalid video format. Allowed formats: " + String.join(", ", ALLOWED_VIDEO_TYPES));
        }
        if (video.getSize() > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            throw new IllegalArgumentException("Video size must be less than " + MAX_VIDEO_SIZE_MB + "MB");
        }
    }

    public UserProgress getUserProgress(String userId, String tutorialId) {
        try {
            return userProgressRepository
                .findByUserIdAndTutorialId(userId, tutorialId)
                .orElseGet(() -> {
                    UserProgress progress = new UserProgress();
                    progress.setUserId(userId);
                    progress.setTutorialId(tutorialId);
                    progress.setCompletedSteps(new ArrayList<>());
                    progress.setLastUpdated(LocalDateTime.now());
                    progress.setCompleted(false);
                    return userProgressRepository.save(progress);
                });
        } catch (Exception e) {
            throw new RuntimeException("Failed to get user progress: " + e.getMessage());
        }
    }

    public UserProgress updateProgress(String userId, String tutorialId, Integer stepIndex) {
        try {
            validateTutorialAndStep(tutorialId, stepIndex);
            
            UserProgress progress = getUserProgress(userId, tutorialId);
            List<Integer> completedSteps = new ArrayList<>(
                progress.getCompletedSteps() != null ? progress.getCompletedSteps() : new ArrayList<>()
            );

            if (!completedSteps.contains(stepIndex)) {
                completedSteps.add(stepIndex);
            } else {
                completedSteps.remove(stepIndex);
            }

            progress.setCompletedSteps(completedSteps);
            progress.setLastUpdated(LocalDateTime.now());
            
            Tutorial tutorial = getTutorialById(tutorialId);
            progress.setCompleted(completedSteps.size() == tutorial.getSteps().size());

            return userProgressRepository.save(progress);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update progress: " + e.getMessage());
        }
    }

    private void validateTutorialAndStep(String tutorialId, Integer stepIndex) {
        Tutorial tutorial = getTutorialById(tutorialId);
        if (stepIndex < 0 || stepIndex >= tutorial.getSteps().size()) {
            throw new IllegalArgumentException("Invalid step index");
        }
    }

    public void deleteTutorial(String id) {
        Tutorial tutorial = getTutorialById(id);
        
        // Delete associated media files
        if (tutorial.getMediaIds() != null) {
            tutorial.getMediaIds().forEach(mediaId -> {
                try {
                    gridFSBucket.delete(new org.bson.types.ObjectId(mediaId));
                } catch (Exception ex) {
                    System.err.println("Error deleting media file: " + ex.getMessage());
                }
            });
        }

        tutorialRepository.deleteById(id);
    }
}
