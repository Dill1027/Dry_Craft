package com.example.backend.repository;

import com.example.backend.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findBySellerId(String sellerId);
    List<Message> findByBuyerId(String buyerId);
    List<Message> findBySellerIdAndIsReadFalse(String sellerId);
    List<Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByCreatedAtDesc(
        String senderId1, String receiverId1, String senderId2, String receiverId2);
    List<Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByCreatedAtAsc(
        String senderId1, String receiverId1, String senderId2, String receiverId2);
    List<Message> findByBuyerIdOrSellerIdOrderByCreatedAtDesc(String userId1, String userId2);

    @Query(value = "{ $or: [ {'senderId': ?0}, {'receiverId': ?0} ] }", 
           sort = "{ 'createdAt': -1 }")
    List<Message> findMessageHistory(String userId);

    @Query("{ $or: [ " +
           "{ 'senderId': ?0, 'receiverId': ?1 }, " +
           "{ 'senderId': ?1, 'receiverId': ?0 }, " +
           "{ 'buyerId': ?0, 'sellerId': ?1 }, " +
           "{ 'buyerId': ?1, 'sellerId': ?0 } " +
           "] }")
    List<Message> findMessagesByUsers(String user1, String user2);
}
