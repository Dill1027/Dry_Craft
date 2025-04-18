package com.example.backend.controller;

import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.bson.types.ObjectId;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.PostResponse;
import com.example.backend.service.PostService;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSDownloadStream;
import com.mongodb.client.gridfs.model.GridFSFile;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class PostController {
    private static final Logger logger = Logger.getLogger(PostController.class.getName());
    private final PostService postService;
    private final GridFSBucket gridFSBucket;

    public PostController(PostService postService, GridFSBucket gridFSBucket) {
        this.postService = postService;
        this.gridFSBucket = gridFSBucket;
    }

    @PostMapping("/posts")
    public ResponseEntity<PostResponse> createPost(
            @RequestParam("userId") String userId,
            @RequestParam("content") String content,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "video", required = false) MultipartFile video) {
        try {
            if (userId == null || userId.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            logger.log(Level.INFO, "Creating post for user: {0}", userId);
            if (video != null) {
                logger.log(Level.INFO, "Video included: {0}, size: {1}, type: {2}", 
                    new Object[]{video.getOriginalFilename(), video.getSize(), video.getContentType()});
            }

            PostResponse post = postService.createPost(userId, content, images, video);
            logger.log(Level.INFO, "Post created successfully with ID: {0}", post.getId());
            return ResponseEntity.ok(post);
        } catch (IllegalArgumentException e) {
            logger.log(Level.WARNING, "Invalid request data: {0}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error creating post", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/posts")
    public ResponseEntity<List<PostResponse>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    @GetMapping("/posts/user/{userId}")
    public ResponseEntity<List<PostResponse>> getUserPosts(@PathVariable String userId) {
        return ResponseEntity.ok(postService.getUserPosts(userId));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable String postId,
            @RequestParam String userId) {
        try {
            postService.deletePost(postId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable String postId,
            @RequestParam String userId,
            @RequestParam String content,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        try {
            PostResponse post = postService.updatePost(postId, userId, content, images);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/media/{mediaId}")
    public ResponseEntity<Resource> getMedia(@PathVariable String mediaId) {
        try {
            logger.log(Level.INFO, "Fetching media with ID: {0}", mediaId);
            
            if (!ObjectId.isValid(mediaId)) {
                logger.log(Level.WARNING, "Invalid media ID format: {0}", mediaId);
                return ResponseEntity.badRequest().build();
            }
            
            ObjectId objectId = new ObjectId(mediaId);
            GridFSFile file = gridFSBucket.find(new org.bson.Document("_id", objectId)).first();
            
            if (file == null) {
                logger.log(Level.WARNING, "Media not found with ID: {0}", mediaId);
                return ResponseEntity.notFound().build();
            }

            String contentType = determineContentType(file.getFilename(), file.getMetadata());
            long contentLength = file.getLength();

            if (contentLength == 0) {
                logger.log(Level.WARNING, "Empty media file: {0}", mediaId);
                return ResponseEntity.noContent().build();
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream((int) contentLength);
            try (GridFSDownloadStream downloadStream = gridFSBucket.openDownloadStream(objectId)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = downloadStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
            }

            byte[] data = outputStream.toByteArray();
            if (data.length == 0) {
                logger.log(Level.WARNING, "Failed to read media data: {0}", mediaId);
                return ResponseEntity.noContent().build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(data.length);
            headers.setCacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic());
            headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
            headers.set(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Length, Content-Range");

            return ResponseEntity.ok()
                .headers(headers)
                .body(new ByteArrayResource(data));

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error retrieving media: " + mediaId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String determineContentType(String filename, org.bson.Document metadata) {
        String defaultType = "application/octet-stream";
        
        try {
            if (metadata != null) {
                String contentType = metadata.getString("contentType");
                if (contentType != null) return contentType;
                
                String type = metadata.getString("type");
                if ("image".equals(type)) return "image/jpeg";
                if ("video".equals(type)) return "video/mp4";
            }

            if (filename != null) {
                String lower = filename.toLowerCase();
                if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
                if (lower.endsWith(".png")) return "image/png";
                if (lower.endsWith(".gif")) return "image/gif";
                if (lower.endsWith(".webp")) return "image/webp";
                if (lower.endsWith(".mp4")) return "video/mp4";
                if (lower.endsWith(".mov")) return "video/quicktime";
            }
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error determining content type", e);
        }

        return defaultType;
    }
}