package com.example.backend.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;
import java.util.logging.Logger;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.Post;
import com.example.backend.model.PostResponse;
import com.example.backend.model.Reaction;
import com.example.backend.model.User;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;
    private final GridFSBucket gridFSBucket;
    private final Logger logger = Logger.getLogger(PostService.class.getName());

    private static final int MAX_VIDEO_SIZE_MB = 15; // 15MB
    private static final List<String> ALLOWED_VIDEO_TYPES = List.of("video/mp4", "video/quicktime");
    private static final int MAX_VIDEO_DURATION_SECONDS = 30;

    @Autowired
    public PostService(
            PostRepository postRepository,
            UserRepository userRepository,
            MongoTemplate mongoTemplate) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
        this.gridFSBucket = GridFSBuckets.create(mongoTemplate.getDb(), "media");
    }

    private User getUserDetails(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public String getUserName(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return String.format("%s %s", user.getFirstName(), user.getLastName());
    }

    private PostResponse convertToPostResponse(Post post) {
        PostResponse response = new PostResponse(post);
        try {
            User user = getUserDetails(post.getUserId());
            response.setUserName(user.getFirstName() + " " + user.getLastName());
            response.setUserProfilePicture(user.getProfilePicture());
        } catch (Exception e) {
            response.setUserName("Unknown User");
        }
        response.setLikeCount(post.getLikeCount());
        String currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            response.setIsLiked(post.isLikedByUser(currentUserId));
        }
        response.setReactionCounts(post.getReactionCounts());
        return response;
    }

    private String getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                return auth.getName();
            }
        } catch (Exception e) {
            System.err.println("Error getting current user id: " + e.getMessage());
        }
        return null;
    }

    public PostResponse createPost(String userId, String content, List<MultipartFile> images, MultipartFile video) throws IOException {
        if ((video == null && (images == null || images.isEmpty())) && content.isEmpty()) {
            throw new IllegalArgumentException("Post must have content, images, or a video");
        }

        Post post = new Post();
        post.setUserId(userId);
        post.setContent(content);
        post.setCreatedAt(LocalDateTime.now());
        post.setLikedByUsers(new HashSet<>()); // Initialize empty set instead of using setLikes
        post.setUserReactions(new HashMap<>()); // Initialize empty reactions map
        post.setReactionCounts(new HashMap<>()); // Initialize empty reaction counts
        post.setComments(new ArrayList<>());
        List<String> mediaIds = new ArrayList<>();

        try {
            // Handle video upload
            if (video != null && !video.isEmpty()) {
                validateVideo(video);
                String videoId = saveMedia(video, "video");
                mediaIds.add(videoId);
                post.setVideoUrl("/api/media/" + videoId); // URL for retrieval
            }

            // Handle image uploads
            if (images != null && !images.isEmpty()) {
                for (MultipartFile image : images) {
                    if (!image.getContentType().startsWith("image/")) {
                        throw new IllegalArgumentException("Only image files are supported");
                    }
                    String imageId = saveMedia(image, "image");
                    mediaIds.add(imageId);
                }
                post.setImageUrls(mediaIds.stream()
                        .map(id -> "/api/media/" + id)
                        .collect(Collectors.toList()));
            }

            post.setMediaIds(mediaIds); // Store GridFS IDs
            Post savedPost = postRepository.save(post);
            return convertToPostResponse(savedPost);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save media: " + e.getMessage());
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
        // Note: Duration validation requires FFmpeg or external library.
        // For simplicity, assuming frontend enforces 30s limit.
        // If needed, reintroduce JAVE or use FFmpeg CLI via ProcessBuilder.
    }

    private String saveMedia(MultipartFile file, String type) throws IOException {
        GridFSUploadOptions options = new GridFSUploadOptions()
                .metadata(new org.bson.Document("type", type));
        ObjectId fileId = gridFSBucket.uploadFromStream(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "media_" + type,
                file.getInputStream(),
                options);
        return fileId.toHexString();
    }

    public List<PostResponse> getAllPosts() {
        try {
            List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
            return posts.stream()
                    .map(this::convertToPostResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.warning("Error retrieving posts: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<PostResponse> getUserPosts(String userId) {
        List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return posts.stream()
                .map(this::convertToPostResponse)
                .collect(Collectors.toList());
    }

    public void deletePost(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own posts");
        }

        // Delete associated media from GridFS
        if (post.getMediaIds() != null) {
            for (String mediaId : post.getMediaIds()) {
                try {
                    gridFSBucket.delete(new ObjectId(mediaId));
                } catch (Exception e) {
                    System.err.println("Failed to delete media: " + mediaId);
                }
            }
        }

        postRepository.deleteById(postId);
    }

    public PostResponse updatePost(String postId, String userId, String content, List<MultipartFile> images) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only update your own posts");
        }

        post.setContent(content);
        List<String> mediaIds = new ArrayList<>(post.getMediaIds() != null ? post.getMediaIds() : new ArrayList<>());

        try {
            if (images != null && !images.isEmpty()) {
                // Delete old media
                if (!mediaIds.isEmpty()) {
                    for (String mediaId : mediaIds) {
                        try {
                            gridFSBucket.delete(new ObjectId(mediaId));
                        } catch (Exception e) {
                            System.err.println("Failed to delete old media: " + mediaId);
                        }
                    }
                    mediaIds.clear();
                }

                // Save new images
                for (MultipartFile image : images) {
                    if (!image.getContentType().startsWith("image/")) {
                        throw new IllegalArgumentException("Only image files are supported");
                    }
                    String imageId = saveMedia(image, "image");
                    mediaIds.add(imageId);
                }
                post.setImageUrls(mediaIds.stream()
                        .map(id -> "/api/media/" + id)
                        .collect(Collectors.toList()));
            }

            post.setMediaIds(mediaIds);
            Post updatedPost = postRepository.save(post);
            return convertToPostResponse(updatedPost);
        } catch (IOException e) {
            throw new RuntimeException("Failed to update media: " + e.getMessage());
        }
    }

    public PostResponse toggleLike(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getLikedByUsers().contains(userId)) {
            post.getLikedByUsers().remove(userId);
        } else {
            post.getLikedByUsers().add(userId);
        }

        post = postRepository.save(post);
        return new PostResponse(post, userId);
    }

    public PostResponse addComment(String postId, String userId, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        User user = getUserDetails(userId);
        String authorName = user.getFirstName() + " " + user.getLastName();
        String commentText = userId + "|" + authorName + ": " + content;
        
        post.getComments().add(commentText);
        post = postRepository.save(post);
        
        return convertToPostResponse(post);
    }

    public PostResponse updateComment(String postId, int commentIndex, String userId, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (commentIndex < 0 || commentIndex >= post.getComments().size()) {
            throw new IllegalArgumentException("Invalid comment index");
        }

        String existingComment = post.getComments().get(commentIndex);
        String commentAuthorId = existingComment.split("\\|")[0];
        
        if (!commentAuthorId.equals(userId)) {
            throw new IllegalArgumentException("You can only edit your own comments");
        }

        User user = getUserDetails(userId);
        String authorName = user.getFirstName() + " " + user.getLastName();
        String commentText = userId + "|" + authorName + ": " + content;
        
        List<String> comments = post.getComments();
        comments.set(commentIndex, commentText);
        post = postRepository.save(post);
        
        return convertToPostResponse(post);
    }

    public PostResponse deleteComment(String postId, int commentIndex, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (commentIndex < 0 || commentIndex >= post.getComments().size()) {
            throw new IllegalArgumentException("Invalid comment index");
        }

        // Check if user is post owner or comment author
        String comment = post.getComments().get(commentIndex);
        String commentAuthorId = comment.split("\\|")[0];

        if (!userId.equals(post.getUserId()) && !userId.equals(commentAuthorId)) {
            throw new IllegalArgumentException("You can only delete your own comments or comments on your posts");
        }

        List<String> comments = post.getComments();
        comments.remove(commentIndex);
        post = postRepository.save(post);
        
        return convertToPostResponse(post);
    }

    public boolean canModifyComment(String postId, int commentIndex, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (commentIndex < 0 || commentIndex >= post.getComments().size()) {
            throw new IllegalArgumentException("Invalid comment index");
        }

        String comment = post.getComments().get(commentIndex);
        String commentAuthorId = comment.split("\\|")[0];

        // Only allow comment author to modify
        return userId.equals(commentAuthorId);
    }

    public boolean isPostOwner(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return post.getUserId().equals(userId);
    }

    public PostResponse handleReaction(String postId, String userId, String reactionType) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getUserReactions() == null) {
            post.setUserReactions(new HashMap<>());
        }

        // Remove existing reaction if same type or add new reaction
        if (post.getUserReaction(userId) != null && 
            post.getUserReaction(userId).toString().equals(reactionType)) {
            post.getUserReactions().remove(userId);
        } else if (reactionType != null && !reactionType.isEmpty()) {
            try {
                Reaction reaction = Reaction.valueOf(reactionType.toUpperCase());
                post.getUserReactions().put(userId, reaction);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid reaction type: must be LIKE or HEART");
            }
        }

        // Update reaction counts
        post.updateReactionCounts();
        post = postRepository.save(post);

        PostResponse response = new PostResponse(post);
        response.setUserReaction(post.getUserReaction(userId));
        response.setReactionCounts(post.getReactionCounts());
        
        return response;
    }

    public PostResponse deleteAllComments(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        
        post.setComments(new ArrayList<>());
        post = postRepository.save(post);
        
        return convertToPostResponse(post);
    }
}