import express from "express";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

// Validate file paths to prevent traversal attacks
const validateFilePath = (filePath) => {
  const resolvedPath = path.resolve(filePath);
  const baseDir = path.resolve(process.cwd());
  return resolvedPath.startsWith(baseDir);
};

app.get("/", (req, res) => {
  res.send("ToonGen Backend Running 🚀");
});

app.post("/render-video", (req, res) => {
  try {
    const { images, audio } = req.body;

    // Input validation
    if (!images || !Array.isArray(images) || images.length < 2) {
      return res.status(400).json({ error: "At least 2 images required" });
    }

    if (!audio || typeof audio !== "string") {
      return res.status(400).json({ error: "Audio file path required" });
    }

    // Validate file paths
    if (!validateFilePath(images[0]) || !validateFilePath(images[1]) || !validateFilePath(audio)) {
      return res.status(400).json({ error: "Invalid file paths" });
    }

    // Check file existence
    if (!fs.existsSync(images[0]) || !fs.existsSync(images[1]) || !fs.existsSync(audio)) {
      return res.status(400).json({ error: "One or more input files not found" });
    }

    const outputPath = path.join(process.cwd(), "output.mp4");

    // FFmpeg arguments as array (prevents command injection)
    const args = [
      "-y",
      "-loop", "1", "-t", "3", "-i", images[0],
      "-loop", "1", "-t", "3", "-i", images[1],
      "-i", audio,
      "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0[outv]",
      "-map", "[outv]",
      "-map", "2:a",
      "-shortest",
      outputPath
    ];

    execFile("ffmpeg", args, (err) => {
      if (err) {
        console.error("FFmpeg error:", err);
        return res.status(500).json({ error: "FFmpeg processing failed" });
      }

      res.json({ video: "output.mp4" });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
