import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpinnerCustom } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Selection = () => {
  const location = useLocation();
  const record = location.state; // data passed from sidebar

  // 🔹 Initialize state
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(record?.summary || "");
  const [title, setTitle] = useState(record?.title || "");
  const [text, settext] = useState(record?.transcription || "");
  const [audioUrl, setAudioUrl] = useState(record?.blobUrl || "");
  const [prompt, setprompt] = useState(record?.prompt || "");

  // ✅ Detect navigation changes (e.g., Home clicked)
  useEffect(() => {
    if (record) {
      // Viewing record mode
      setTitle(record.title || "");
      setResult(record.summary || "");
      setAudioUrl(record.blobUrl || "");
      settext(record.transcription || "");
      setprompt(record.prompt || "");
    } else {
      // Reset for new upload mode
      setTitle("");
      setResult("");
      setAudioUrl("");
      settext("");
      setprompt("");
      setFile(null);
    }
  }, [record]);

  const isReadOnly = !!record; // true if accessed from sidebar

  const handleUpload = async () => {
    if (!file) return alert("Please select an audio or video file!");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const username = localStorage.getItem("username") || "guest";
      if (!username) {
        alert("Please login");
        return;
      }
      if (title === "") {
        alert("Enter a title");
        return;
      }
      if (prompt === "") {
        alert("enter prompt");
        return;
      }

      formData.append("username", username);
      formData.append("title", title);
      formData.append("prompt", prompt);

      const res = await fetch("https://springappllm.azurewebsites.net/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      console.log(data);
      setResult(data.summary || "No summary found.");
      settext(data.transcription || "No transcription found");
    } catch (err) {
      console.error(err);
      alert("Error uploading or analyzing the file.");
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
          {/* Title */}
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
            onChange={(e) => setprompt(e.target.value)}
            placeholder="Enter Prompt"
            disabled={isReadOnly || loading}
          />

          {/* Audio Player if record has blobUrl */}
          {isReadOnly && audioUrl && (
            <div className="mt-3">
              <audio controls src={audioUrl} className="w-full rounded-md">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* File input (only if new upload) */}
          {!isReadOnly && (
            <Input
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => setFile(e.target.files[0])}
              disabled={isReadOnly || loading}
            />
          )}

          {/* Submit button (only for upload mode) */}
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

          {/* Display Summary */}
          {result && (
            <div className="bg-gray-100 p-3 rounded-lg border text-gray-700 w-96">
              <Accordion type="single" collapsible>
                {/* Summary Section */}
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

                {/* Transcription Section */}
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
