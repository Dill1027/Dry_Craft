package com.example.backend.controller;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.PostResponse;
import com.example.backend.service.NotificationService;
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
    private final NotificationService notificationService;

    public PostController(PostService postService, GridFSBucket gridFSBucket, NotificationService notificationService) {
        this.postService = postService;
        this.gridFSBucket = gridFSBucket;
        this.notificationService = notificationService;
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
        try {
            return ResponseEntity.ok(postService.getAllPosts());
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error fetching posts: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<PostResponse> toggleLike(
            @PathVariable String postId,
            @RequestParam String userId) {
        try {
            PostResponse response = postService.toggleLike(postId, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error toggling like: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<PostResponse> addComment(
            @PathVariable String postId,
            @RequestParam String userId,
            @RequestParam String content,
            @RequestParam(required = false) String parentCommentId) {
        try {
            PostResponse response;
            if (parentCommentId != null) {
                // Handle reply
                response = postService.addReply(postId, userId, content, parentCommentId);
            } else {
                // Handle regular comment
                response = postService.addComment(postId, userId, content);
            }
            
            // Create notification for post owner if commenter is not the owner
            if (!response.getUserId().equals(userId)) {
                try {
                    String commenterName = postService.getUserName(userId);
                    notificationService.createNotification(
                        response.getUserId(),
                        userId,
                        commenterName,
                        postId,
                        String.format(parentCommentId != null ? "replied: %s" : "commented: %s", content),
                        parentCommentId != null ? "REPLY" : "COMMENT"
                    );
                    logger.log(Level.INFO, "Notification created for user: " + response.getUserId());
                } catch (Exception e) {
                    logger.log(Level.WARNING, "Failed to create notification: " + e.getMessage());
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.log(Level.WARNING, "Invalid input: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error adding comment/reply: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/posts/{postId}/comments/{commentIndex}")
    public ResponseEntity<PostResponse> updateComment(
            @PathVariable String postId,
            @PathVariable int commentIndex,
            @RequestParam String userId,
            @RequestParam String content) {
        try {
            // Validate comment ownership and post ownership
            if (!postService.canModifyComment(postId, commentIndex, userId)) {
                logger.log(Level.WARNING, "Unauthorized attempt to update comment by user: " + userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            PostResponse response = postService.updateComment(postId, commentIndex, userId, content);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error updating comment: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/posts/{postId}/comments/{commentIndex}")
    public ResponseEntity<PostResponse> deleteComment(
            @PathVariable String postId,
            @PathVariable int commentIndex,
            @RequestParam String userId) {
        try {
            // Validate comment ownership and post ownership
            if (!postService.canModifyComment(postId, commentIndex, userId)) {
                logger.log(Level.WARNING, "Unauthorized attempt to delete comment by user: " + userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            PostResponse response = postService.deleteComment(postId, commentIndex, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error deleting comment: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/posts/{postId}/comments/{commentIndex}/profile")
    public ResponseEntity<PostResponse> deleteProfileComment(
            @PathVariable String postId,
            @PathVariable int commentIndex,
            @RequestParam String userId) {
        try {
            // Check if user owns the post
            if (!postService.isPostOwner(postId, userId)) {
                logger.log(Level.WARNING, "User " + userId + " attempted to delete comment on post they don't own");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            PostResponse response = postService.deleteComment(postId, commentIndex, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error deleting comment from profile: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/posts/{postId}/comments/all")
    public ResponseEntity<PostResponse> deleteAllComments(
            @PathVariable String postId,
            @RequestParam String userId) {
        try {
            // Check if user owns the post
            if (!postService.isPostOwner(postId, userId)) {
                logger.log(Level.WARNING, "User " + userId + " attempted to delete all comments on post they don't own");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            PostResponse response = postService.deleteAllComments(postId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error deleting all comments: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/posts/{postId}/reactions")
    public ResponseEntity<PostResponse> handleReaction(
            @PathVariable String postId,
            @RequestBody Map<String, String> payload) {
        try {
            String userId = payload.get("userId");
            String reactionType = payload.get("reactionType");
            
            if (userId == null || reactionType == null) {
                return ResponseEntity.badRequest().build();
            }
            
            PostResponse response = postService.handleReaction(postId, userId, reactionType);
            
            // Create notification for post owner if reactor is not the owner
            if (!response.getUserId().equals(userId)) {
                try {
                    String reactorName = postService.getUserName(userId);
                    notificationService.createNotification(
                        response.getUserId(),
                        userId,
                        reactorName,
                        postId,
                        String.format("reacted with %s", reactionType.toLowerCase()),
                        "REACTION"
                    );
                } catch (Exception e) {
                    logger.log(Level.WARNING, "Failed to create reaction notification", e);
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error handling reaction: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/media/{mediaId}")
    public ResponseEntity<Resource> getMedia(
            @PathVariable String mediaId,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {
        try {
            if (!ObjectId.isValid(mediaId)) {
                return ResponseEntity.badRequest().build();
            }

            ObjectId objectId = new ObjectId(mediaId);
            GridFSFile file = gridFSBucket.find(new org.bson.Document("_id", objectId)).first();

            if (file == null) {
                return ResponseEntity.notFound().build();
            }

            long contentLength = file.getLength();
            long start = 0;
            long end = contentLength - 1;
            long chunkSize = Math.min(1024 * 1024, contentLength);

            if (rangeHeader != null) {
                String[] ranges = rangeHeader.replace("bytes=", "").split("-");
                start = Long.parseLong(ranges[0]);
                if (ranges.length > 1) {
                    end = Long.parseLong(ranges[1]);
                } else {
                    end = Math.min(start + chunkSize - 1, contentLength - 1);
                }
            }

            HttpHeaders headers = new HttpHeaders();
            headers.add("Accept-Ranges", "bytes");
            headers.add("Content-Range", String.format("bytes %d-%d/%d", start, end, contentLength));
            headers.setContentLength(end - start + 1);
            headers.setCacheControl(CacheControl.noCache());
            
            // Set proper content type
            String contentType = determineContentType(file.getFilename(), file.getMetadata());
            headers.setContentType(MediaType.parseMediaType(contentType));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            try (GridFSDownloadStream downloadStream = gridFSBucket.openDownloadStream(objectId)) {
                downloadStream.skip(start);
                byte[] buffer = new byte[4096];
                int bytesRead;
                long totalRead = 0;
                while (totalRead < (end - start + 1) && (bytesRead = downloadStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, (int) Math.min(bytesRead, (end - start + 1) - totalRead));
                    totalRead += bytesRead;
                }
            }

            return ResponseEntity.status(rangeHeader != null ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK)
                    .headers(headers)
                    .body(new ByteArrayResource(outputStream.toByteArray()));

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