package com.example.backend.controller;

import com.example.backend.model.Message;
import com.example.backend.model.MessageRequest;
import com.example.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {
    @Autowired
    private MessageService messageService;
    
    @PostMapping
    public ResponseEntity<Message> createMessage(@RequestBody MessageRequest request) {
        Message message = messageService.createMessage(
            request.getSellerId(), 
            request.getBuyerId(),
            request.getProductId(),
            request.getContent()
        );
        return ResponseEntity.ok(message);
    }
    
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<Message>> getSellerMessages(@PathVariable String sellerId) {
        return ResponseEntity.ok(messageService.getSellerMessages(sellerId));
    }
    
    @GetMapping("/unread/{sellerId}")
    public ResponseEntity<List<Message>> getUnreadMessages(@PathVariable String sellerId) {
        return ResponseEntity.ok(messageService.getUnreadMessages(sellerId));
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<Message> markAsRead(@PathVariable String id) {
        return ResponseEntity.ok(messageService.markAsRead(id));
    }
    
    @PostMapping("/{id}/reply")
    public ResponseEntity<Message> replyToMessage(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String replyContent = request.get("replyContent");
        Message message = messageService.replyToMessage(id, replyContent);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<Message>> getBuyerMessages(@PathVariable String buyerId) {
        return ResponseEntity.ok(messageService.getBuyerMessages(buyerId));
    }
}
