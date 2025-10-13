//package com.example.demo.controller;
//
//import com.microsoft.cognitiveservices.speech.SpeechConfig;
//import com.microsoft.cognitiveservices.speech.SpeechRecognitionResult;
//import com.microsoft.cognitiveservices.speech.SpeechRecognizer;
//import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.bind.annotation.RestController;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.File;
//import java.util.Map;
//
//@RestController
//public class AzureASRController {
//
//    @Value("${azure.speech.key}")
//    private String speechKey;
//
//    @Value("${azure.speech.region}")
//    private String speechRegion;
//
//    @PostMapping("/upload")
//    public ResponseEntity<?> transcribeAudio(@RequestParam("file") MultipartFile file) {
//        File tempFile = null;
//        try {
//            System.out.println("reached to backend" + file.getOriginalFilename());
//            // 1️⃣ Save the uploaded file locally
//            tempFile = File.createTempFile("audio-", file.getOriginalFilename());
//            file.transferTo(tempFile);
//
//            // 2️⃣ Create Azure Speech config
//            SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
//
//            // 3️⃣ Create audio input from the saved file
//            AudioConfig audioConfig = AudioConfig.fromWavFileInput(tempFile.getAbsolutePath());
//
//            // 4️⃣ Create speech recognizer
//            SpeechRecognizer recognizer = new SpeechRecognizer(speechConfig, audioConfig);
//
//            System.out.println("🎙 Starting transcription...");
//            SpeechRecognitionResult result = recognizer.recognizeOnceAsync().get();
//
//            String transcript = result.getText();
//            System.out.println("📝 Transcription: " + transcript);
//
////            to chage audio file format
////                    go to https://audio.online-convert.com/convert-to-wav {
////            upload audio  and then
////            Setting	What to Choose	Explanation
////            Change bit resolution	✅ 16 bit
////            Change audio frequency	✅ 16000 Hz
////            Change audio channels	✅ 1 (mono)
////            click start
//
//            // 5️⃣ Return to frontend
//            return ResponseEntity.ok(Map.of("summary", transcript));
//
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.internalServerError()
//                    .body(Map.of("error", e.getMessage()));
//        } finally {
//            if (tempFile != null && tempFile.exists()) tempFile.delete();
//        }
//    }
//}


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

import javax.sound.sampled.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class AzureASRController {

    static {
        // ✅ Set FFmpeg & FFprobe paths globally (executed once)
        System.setProperty("ws.schild.jave.ffmpeg.path", "C:\\ffmpeg\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe");
        System.setProperty("ws.schild.jave.ffprobe.path", "C:\\ffmpeg\\ffmpeg-8.0-essentials_build\\bin\\ffprobe.exe");
    }

    @Autowired
    private AzureBlobService blobService;

    @Autowired
    private SummaryService summaryService;

    @Autowired
    private Summry_repo  repo;

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


    private File convertToAzureCompatibleWav(File inputFile) throws IOException, InterruptedException {

        System.out.println("🔄 Converting to Azure-compatible WAV (16kHz, mono, 16-bit)...");

        // ✅ Use the full absolute path to ffmpeg.exe
        String ffmpegPath = "C:\\ffmpeg\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe";

        File ffmpegFile = new File(ffmpegPath);
        System.out.println("🔍 Checking FFmpeg path: " + ffmpegFile.getAbsolutePath());
        System.out.println("📦 Exists: " + ffmpegFile.exists());

        if (!ffmpegFile.exists()) {
            throw new IOException("❌ FFmpeg not found at path: " + ffmpegPath);
        }

        // Output file path
        File outputFile = new File(inputFile.getParent(), "converted-" + System.currentTimeMillis() + ".wav");

        // ✅ Build FFmpeg command using the absolute path
        ProcessBuilder pb = new ProcessBuilder(
                ffmpegFile.getAbsolutePath(),
                "-y", // overwrite output
                "-i", inputFile.getAbsolutePath(), // input file
                "-acodec", "pcm_s16le", // 16-bit PCM
                "-ac", "1", // mono channel
                "-ar", "16000", // 16 kHz sample rate
                outputFile.getAbsolutePath() // output file
        );

        pb.redirectErrorStream(true);
        Process process = pb.start();

        // 🪵 Log FFmpeg output for debugging
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            reader.lines().forEach(System.out::println);
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("❌ FFmpeg conversion failed with exit code " + exitCode);
        }

        System.out.println("✅ Converted successfully: " + outputFile.getAbsolutePath());
        return outputFile;
    }


    @PostMapping("/upload")
    public ResponseEntity<?> transcribeAndSummarize(@RequestParam("file") MultipartFile file,@RequestParam("username") String username,@RequestParam("title") String title ,@RequestParam("prompt") String prompt) {
        File tempFile = null;

        try {


            System.out.println("🎧 Received: " + file.getOriginalFilename());
            AzureBlobService.BlobMetadata blobData = blobService.uploadAudio(file);
            System.out.println("☁️ Uploaded: " + blobData.blobName());
            System.out.println("uploaded by user : "  + username);

            File originalFile = File.createTempFile("audio-", file.getOriginalFilename());
            file.transferTo(originalFile);

            System.out.println("🔄 Converting audio to Azure-compatible WAV format...");
            File wavFile = convertToAzureCompatibleWav(originalFile);
            System.out.println("✅ Conversion complete: " + wavFile.getAbsolutePath());

            SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
            AudioConfig audioConfig = AudioConfig.fromWavFileInput(wavFile.getAbsolutePath());
            SpeechRecognizer recognizer = new SpeechRecognizer(speechConfig, audioConfig);

            System.out.println("🎙 Starting transcription...");
            SpeechRecognitionResult result = recognizer.recognizeOnceAsync().get();
            String transcript = result.getText();
            System.out.println("📝 Transcription: " + transcript);


            if (transcript == null || transcript.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No transcription detected."));
            }

            // 3️⃣ Summarize using Azure OpenAI
            System.out.println("🤖 Sending transcription to LLM...");
            OpenAIClient client = new OpenAIClientBuilder()
                    .endpoint(openAiEndpoint)
                    .credential(new AzureKeyCredential(openAiKey))
                    .buildClient();

//            ChatCompletionsOptions options = new ChatCompletionsOptions(
//                    List.of(
//                            new ChatRequestSystemMessage("You are a helpful assistant that summarizes text clearly and concisely."),
//                            new ChatRequestUserMessage("Summarize this text:\n" + transcript)
//                    )
//            );

            String finalPrompt = (prompt == null || prompt.isBlank())
                    ? "If the following transcript appears to be a meeting, summarize it into key decisions, action items, and topics discussed. If it is not a meeting, provide a concise summary of its content instead."
                    : prompt;

            ChatCompletionsOptions options = new ChatCompletionsOptions(
                    List.of(
                            new ChatRequestSystemMessage("You are an AI assistant that extracts meeting insights and summaries."),
                            new ChatRequestUserMessage(finalPrompt + "\n\n" + transcript)
                    )
            );



            ChatCompletions completions = client.getChatCompletions(deploymentName, options);
            String summary = completions.getChoices().get(0).getMessage().getContent();

            System.out.println("✅ Summary: " + summary);
            Summary summary1 = new Summary();
            summary1.setSummary(summary);
            summary1.setText(transcript);
            summary1.setBlobUrl(blobData.blobUrl());
            summary1.setAudioId(blobData.audioId());
            summary1.setUsername(username);
            summary1.setBlobName(blobData.blobName());
            summary1.setTitle(title);
            summary1.setPrompt(prompt);

            if(summaryService.saveSummary(summary1)) {
                return ResponseEntity.ok(Map.of(
                        "transcription", transcript,
                        "summary", summary
                ));
            }
            // 4️⃣ Return transcription + summary to frontend
            else{
                return ResponseEntity.ok(Map.of(
                        "transcription", "error",
                        "summary", "error"
                ));
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        } finally {
            if (tempFile != null && tempFile.exists()) tempFile.delete();
        }
    }

    @GetMapping("/get/{username}")
    public ResponseEntity<?> get(@PathVariable String username) {
        List<Summary> summaries = repo.findAllByUsername(username);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Summary summary : summaries) {
            Map<String, Object> map = new HashMap<>();
            map.put("summary", summary.getSummary());
            map.put("transcription", summary.getText());
            map.put("audioBase64", Base64.getEncoder().encodeToString(blobService.getFileBytes(summary.getBlobName())));
            map.put("audioId", summary.getAudioId());
            map.put("blobUrl", summary.getBlobUrl());
            map.put("title", summary.getTitle());
            map.put("id",summary.getId());
            map.put("prompt", summary.getPrompt());
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> delete(@RequestParam("username") String username,@RequestParam("id") Integer id ) {
        Summary summary = repo.findByIdAndUsername(id,username);
        if(blobService.deleteBlob(summary.getBlobName())) {
            repo.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }

}
