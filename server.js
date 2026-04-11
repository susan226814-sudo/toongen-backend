import express from "express";
import { exec } from "child_process";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ToonGen Backend Running 🚀");
});

app.post("/render-video", (req, res) => {
  const { images, audio } = req.body;

  const cmd = `ffmpeg -y \
-loop 1 -t 3 -i ${images[0]} \
-loop 1 -t 3 -i ${images[1]} \
-i ${audio} \
-filter_complex \"[0:v][1:v]concat=n=2:v=1:a=0[outv]\" \
-map \"[outv]\" -map 2:a \
-shortest output.mp4`;

  exec(cmd, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("FFmpeg error");
    }

    res.json({
      video: "output.mp4"
    });
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
