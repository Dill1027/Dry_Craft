package com.example.backend.service;

import java.io.IOException;
import java.io.OutputStream;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;

@Service
public class MediaService {
    private final GridFSBucket gridFSBucket;

    @Autowired
    public MediaService(MongoTemplate mongoTemplate) {
        this.gridFSBucket = GridFSBuckets.create(mongoTemplate.getDb(), "media");
    }

    public String saveMedia(MultipartFile file, String type) throws IOException {
        GridFSUploadOptions options = new GridFSUploadOptions()
                .metadata(new org.bson.Document("type", type));
        
        ObjectId fileId = gridFSBucket.uploadFromStream(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "media_" + type,
                file.getInputStream(),
                options);
                
        return fileId.toHexString();
    }

    public void downloadMedia(String fileId, OutputStream outputStream) {
        try {
            gridFSBucket.downloadToStream(new ObjectId(fileId), outputStream);
        } catch (Exception e) {
            throw new RuntimeException("Error downloading file: " + fileId, e);
        }
    }
}
