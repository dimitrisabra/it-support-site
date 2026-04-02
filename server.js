import fs from "fs";
import path from "path";
import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

const port = Number(process.env.PORT || 3001);
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const allowedOrigins = new Set([
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
});

function buildSystemInstruction(knowledgeContext) {
  return [
    "You are SupportAI, a helpful IT support assistant for this website.",
    "Give clear, practical answers with short troubleshooting steps when useful.",
    "If you are not sure, say so instead of making up facts.",
    knowledgeContext ? `Knowledge context:\n${knowledgeContext}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function toGeminiContents(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter(
      (message) =>
        typeof message?.content === "string" && message.content.trim().length > 0,
    )
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content.trim() }],
    }));
}

function extractText(data) {
  return (data?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function writeSseChunk(res, text) {
  res.write(
    `data: ${JSON.stringify({
      choices: [{ delta: { content: text } }],
    })}\n\n`,
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: geminiModel });
});

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "Missing GEMINI_API_KEY on the server" });
    return;
  }

  const contents = toGeminiContents(req.body?.messages);

  if (!contents.length) {
    res.status(400).json({ error: "At least one message is required" });
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: buildSystemInstruction(req.body?.knowledgeContext) }],
          },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Gemini request failed (${response.status})`;

      try {
        const parsed = JSON.parse(errorText);
        errorMessage = parsed?.error?.message || errorMessage;
      } catch {
        if (errorText.trim()) {
          errorMessage = errorText.trim();
        }
      }

      res.status(response.status).json({ error: errorMessage });
      return;
    }

    const data = await response.json();
    const text = extractText(data);

    if (!text) {
      res.status(502).json({ error: "Gemini returned an empty response" });
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    writeSseChunk(res, text);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Gemini chat error", error);
    res.status(500).json({ error: "Failed to reach Gemini" });
  }
});

if (fs.existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store");
        }
      },
    }),
  );

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`SupportAI server listening on http://localhost:${port}`);
});
