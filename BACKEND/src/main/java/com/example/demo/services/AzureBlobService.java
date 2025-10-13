package com.example.demo.services;
import com.azure.storage.blob.*;
import com.azure.storage.blob.models.*;
import com.azure.core.util.BinaryData;
import java.io.ByteArrayOutputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
public class AzureBlobService {

    @Value("${azure.storage.connection-string}")
    private String connectionString;

    @Value("${azure.storage.container-name}")
    private String containerName;

    public BlobMetadata uploadAudio(MultipartFile file) throws Exception {
        // 1️⃣ Generate unique ID for this audio
        String audioId = UUID.randomUUID().toString();
        String blobName = audioId + "-" + file.getOriginalFilename();

        // 2️⃣ Connect to blob container
        BlobServiceClient serviceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();

        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);
        if (!containerClient.exists()) {
            containerClient.create();
        }

        BlobClient blobClient = containerClient.getBlobClient(blobName);

        // 3️⃣ Upload file
        blobClient.upload(BinaryData.fromStream(file.getInputStream()), true);

        // 4️⃣ Set cheaper storage tier
        blobClient.setAccessTier(AccessTier.COOL);

        // 5️⃣ Return metadata object
        return new BlobMetadata(audioId, blobName, blobClient.getBlobUrl());
    }

    // ✅ Define this record right here
    public record BlobMetadata(String audioId, String blobName, String blobUrl) {}

    public byte[] getFileBytes(String blobNameOrUrl) {
        try {
            // ✅ Clean input — extract only the file name if a full URL was passed
            String blobName = blobNameOrUrl.contains("/")
                    ? blobNameOrUrl.substring(blobNameOrUrl.lastIndexOf("/") + 1)
                    : blobNameOrUrl;

            BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                    .connectionString(connectionString)
                    .buildClient();

            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (!blobClient.exists()) {
                throw new RuntimeException("Blob not found: " + blobName);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            blobClient.download(outputStream);
            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error downloading file: " + e.getMessage());
        }
    }

    public boolean deleteBlob(String blobNameOrUrl) {
        try {
            // 🧹 Extract blob name if full URL is passed
            String blobName = blobNameOrUrl.contains("/")
                    ? blobNameOrUrl.substring(blobNameOrUrl.lastIndexOf("/") + 1)
                    : blobNameOrUrl;

            // 🔗 Connect to Azure Blob container
            BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                    .connectionString(connectionString)
                    .buildClient();

            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (blobClient.exists()) {
                blobClient.delete();
                System.out.println("🗑️ Deleted blob: " + blobName);
                return true;
            } else {
                System.out.println("⚠️ Blob not found: " + blobName);
                return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error deleting blob: " + e.getMessage());
        }
    }



}