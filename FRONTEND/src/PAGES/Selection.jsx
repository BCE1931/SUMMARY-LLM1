import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpinnerCustom } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import * as ffmpegModule from "@ffmpeg/ffmpeg";

let ffmpeg = null;
let ffmpegReady = false;
let fetchFileFn = null;

async function initFFmpeg() {
  if (ffmpegReady) return;

  const { createFFmpeg, fetchFile } = ffmpegModule.default || ffmpegModule;
  if (!createFFmpeg) throw new Error("FFmpeg module failed to load.");

  ffmpeg = createFFmpeg({
    log: true,
    corePath: new URL(
      "/node_modules/@ffmpeg/core/dist/ffmpeg-core.js",
      window.location.origin
    ).href,
  });

  await ffmpeg.load();
  ffmpegReady = true;
  fetchFileFn = fetchFile;

  console.log("✅ FFmpeg loaded successfully!");
}

async function convertToAzureWav(file) {
  if (!ffmpegReady) await initFFmpeg();
  ffmpeg.FS("writeFile", "input", await fetchFileFn(file));
  await ffmpeg.run(
    "-i",
    "input",
    "-acodec",
    "pcm_s16le",
    "-ac",
    "1",
    "-ar",
    "16000",
    "output.wav"
  );
  const data = ffmpeg.FS("readFile", "output.wav");
  return new Blob([data.buffer], { type: "audio/wav" });
}

const Selection = () => {
  const location = useLocation();
  const record = location.state;

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(record?.summary || "");
  const [title, setTitle] = useState(record?.title || "");
  const [text, setText] = useState(record?.transcription || "");
  const [audioUrl, setAudioUrl] = useState(record?.blobUrl || "");
  const [prompt, setPrompt] = useState(record?.prompt || "");

  useEffect(() => {
    initFFmpeg();
    if (record) {
      setTitle(record.title || "");
      setResult(record.summary || "");
      setAudioUrl(record.blobUrl || "");
      setText(record.transcription || "");
      setPrompt(record.prompt || "");
    } else {
      setTitle("");
      setResult("");
      setAudioUrl("");
      setText("");
      setPrompt("");
      setFile(null);
    }
  }, [record]);

  const isReadOnly = !!record;

  const handleUpload = async () => {
    if (!file) return alert("Please select an audio or video file!");
    setLoading(true);
    try {
      const username = localStorage.getItem("username") || "guest";
      if (!username) return alert("Please login");
      if (!title.trim()) return alert("Enter a title");
      if (!prompt.trim()) return alert("Enter a prompt");
      const wavBlob = await convertToAzureWav(file);
      const formData = new FormData();
      formData.append("file", wavBlob, "converted.wav");
      formData.append("username", username);
      formData.append("title", title);
      formData.append("prompt", prompt);
      const res = await fetch("https://springappllm.azurewebsites.net/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setResult(data.summary || "No summary found.");
      setText(data.transcription || "No transcription found.");
    } catch (err) {
      console.error(err);
      alert("Error uploading or processing the file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold text-gray-700">
            {isReadOnly ? "File Details" : "Upload Audio / Video"}
          </CardTitle>
          {isReadOnly && (
            <p className="text-center text-sm text-muted-foreground">
              Viewing saved record
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Title"
            disabled={isReadOnly || loading}
          />
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter Prompt"
            disabled={isReadOnly || loading}
          />
          {isReadOnly && audioUrl && (
            <div className="mt-3">
              <audio controls src={audioUrl} className="w-full rounded-md">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          {!isReadOnly && (
            <Input
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => setFile(e.target.files[0])}
              disabled={loading}
            />
          )}
          {!isReadOnly && (
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={handleUpload}
              disabled={loading}
            >
              {loading && <SpinnerCustom />}
              {loading ? "Analyzing..." : "Submit"}
            </Button>
          )}
          {result && (
            <div className="bg-gray-100 p-3 rounded-lg border text-gray-700 w-96">
              <Accordion type="single" collapsible>
                <AccordionItem value="summary">
                  <AccordionTrigger className="font-semibold text-gray-800">
                    📝 Summary
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm whitespace-pre-wrap text-gray-700">
                      {result}
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="transcription">
                  <AccordionTrigger className="font-semibold text-gray-800">
                    🎙️ Transcription
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm whitespace-pre-wrap text-gray-700">
                      {text}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Selection;
