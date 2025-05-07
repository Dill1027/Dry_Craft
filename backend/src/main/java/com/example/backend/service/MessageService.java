package com.example.backend.service;

import com.example.backend.model.Message;
import com.example.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {
    @Autowired
    private MessageRepository messageRepository;
    
    public Message createMessage(String sellerId, String buyerId, String productId, String content) {
        Message message = new Message();
        message.setSellerId(sellerId);
        message.setBuyerId(buyerId);
        message.setProductId(productId);
        message.setContent(content);
        message.setCreatedAt(LocalDateTime.now());
        message.setRead(false);
        return messageRepository.save(message);
    }
    
    public List<Message> getSellerMessages(String sellerId) {
        return messageRepository.findBySellerId(sellerId);
    }
    
    public List<Message> getBuyerMessages(String buyerId) {
        try {
            return messageRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch buyer messages: " + e.getMessage());
        }
    }
    
    public List<Message> getUnreadMessages(String sellerId) {
        return messageRepository.findBySellerIdAndIsReadFalse(sellerId);
    }
    
    public Message markAsRead(String messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setRead(true);
        return messageRepository.save(message);
    }
    
    public Message replyToMessage(String messageId, String replyContent) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        
        message.setReplyContent(replyContent);
        message.setReplyAt(LocalDateTime.now());
        return messageRepository.save(message);
    }
}
