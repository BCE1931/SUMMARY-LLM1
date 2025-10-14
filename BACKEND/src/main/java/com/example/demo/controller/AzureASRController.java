package com.example.demo.controller;

import com.azure.ai.openai.*;
import com.azure.ai.openai.models.*;
import com.azure.core.credential.AzureKeyCredential;
import com.example.demo.models.Summary;
import com.example.demo.repository.Summry_repo;
import com.example.demo.services.AzureBlobService;
import com.example.demo.services.SummaryService;
import com.microsoft.cognitiveservices.speech.*;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ws.schild.jave.Encoder;
import ws.schild.jave.MultimediaObject;
import ws.schild.jave.encode.AudioAttributes;
import ws.schild.jave.encode.EncodingAttributes;

import java.io.File;
import java.util.*;

@RestController
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://summary-llm-1.vercel.app"
})
public class AzureASRController {

    @Autowired
    private AzureBlobService blobService;

    @Autowired
    private SummaryService summaryService;

    @Autowired
    private Summry_repo repo;

    @Value("${azure.speech.key}")
    private String speechKey;

    @Value("${azure.speech.region}")
    private String speechRegion;

    @Value("${azure.openai.endpoint}")
    private String openAiEndpoint;

    @Value("${azure.openai.key}")
    private String openAiKey;

    @Value("${azure.openai.deployment}")
    private String deploymentName;

    /**
     * Upload audio, transcribe using Azure Speech, summarize using Azure OpenAI,
     * and save to database.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> transcribeAndSummarize(
            @RequestParam("file") MultipartFile file,
            @RequestParam("username") String username,
            @RequestParam("title") String title,
            @RequestParam("prompt") String prompt) {

        File originalFile = null;
        File wavFile = null;

        try {
            System.out.println("🎧 Received file: " + file.getOriginalFilename());

            // Step 1️⃣ Save original file temporarily
            originalFile = File.createTempFile("audio-", file.getOriginalFilename());
            file.transferTo(originalFile);

            // Step 2️⃣ Convert to Azure-compatible WAV using FFmpeg (via JAVE)
            wavFile = new File(originalFile.getParent(), "converted-" + System.currentTimeMillis() + ".wav");
            AudioAttributes audio = new AudioAttributes();
            audio.setCodec("pcm_s16le");
            audio.setChannels(1);
            audio.setSamplingRate(16000);

            EncodingAttributes attrs = new EncodingAttributes();
            attrs.setOutputFormat("wav");
            attrs.setAudioAttributes(audio);

            Encoder encoder = new Encoder();
            encoder.encode(new MultimediaObject(originalFile), wavFile, attrs);

            System.out.println("✅ Converted to: " + wavFile.getAbsolutePath());

            // Step 3️⃣ Transcribe using Azure Speech
            SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
            AudioConfig audioConfig = AudioConfig.fromWavFileInput(wavFile.getAbsolutePath());
            SpeechRecognizer recognizer = new SpeechRecognizer(speechConfig, audioConfig);

            System.out.println("🎙 Transcribing...");
            SpeechRecognitionResult result = recognizer.recognizeOnceAsync().get();
            String transcript = result.getText();
            System.out.println("📝 Transcription: " + transcript);

            if (transcript == null || transcript.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No transcription detected."));
            }

            // Step 4️⃣ Summarize using Azure OpenAI
            OpenAIClient client = new OpenAIClientBuilder()
                    .endpoint(openAiEndpoint)
                    .credential(new AzureKeyCredential(openAiKey))
                    .buildClient();

            String finalPrompt = (prompt == null || prompt.isBlank())
                    ? "Summarize this text clearly and concisely."
                    : prompt;

            ChatCompletionsOptions options = new ChatCompletionsOptions(
                    List.of(
                            new ChatRequestSystemMessage("You are a summarizer."),
                            new ChatRequestUserMessage(finalPrompt + "\n\n" + transcript)
                    )
            );

            ChatCompletions completions = client.getChatCompletions(deploymentName, options);
            String summary = completions.getChoices().get(0).getMessage().getContent();

            System.out.println("✅ Summary: " + summary);

            return ResponseEntity.ok(Map.of(
                    "transcription", transcript,
                    "summary", summary
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        } finally {
            if (originalFile != null && originalFile.exists()) originalFile.delete();
            if (wavFile != null && wavFile.exists()) wavFile.delete();
        }
    }

    /**
     * Fetch all saved summaries for a user
     */
    @GetMapping("/get/{username}")
    public ResponseEntity<?> getUserSummaries(@PathVariable String username) {
        List<Summary> summaries = repo.findAllByUsername(username);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Summary s : summaries) {
            Map<String, Object> map = new HashMap<>();
            map.put("summary", s.getSummary());
            map.put("transcription", s.getText());
            map.put("audioBase64", Base64.getEncoder().encodeToString(blobService.getFileBytes(s.getBlobName())));
            map.put("audioId", s.getAudioId());
            map.put("blobUrl", s.getBlobUrl());
            map.put("title", s.getTitle());
            map.put("id", s.getId());
            map.put("prompt", s.getPrompt());
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Delete a summary + its blob
     */
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteSummary(@RequestParam("username") String username,
                                           @RequestParam("id") Integer id) {
        Summary summary = repo.findByIdAndUsername(id, username);
        if (summary != null && blobService.deleteBlob(summary.getBlobName())) {
            repo.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }
}
