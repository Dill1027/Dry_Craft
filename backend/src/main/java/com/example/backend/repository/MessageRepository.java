package com.example.backend.repository;

import com.example.backend.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findBySellerId(String sellerId);
    List<Message> findByBuyerId(String buyerId);
    List<Message> findBySellerIdAndIsReadFalse(String sellerId);
    List<Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByCreatedAtDesc(
        String senderId1, String receiverId1, String senderId2, String receiverId2);
    List<Message> findByBuyerIdOrSellerIdOrderByCreatedAtDesc(String userId1, String userId2);
}
