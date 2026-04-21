import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import path from "path";
import cors from "cors";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for up to 100MB
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

import { spawn } from "child_process";

async function startServer() {
  // Start Python NLP Service
  console.log("[Server] Starting Python NLP Service...");
  const pythonProcess = spawn("python3", ["-m", "nlp_service.main"], {
    env: { ...process.env, PYTHONPATH: process.cwd() }
  });

  pythonProcess.stdout.on("data", (data) => {
    console.log(`[Python NLP] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`[Python NLP Error] ${data.toString().trim()}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`[Server] Python NLP Service exited with code ${code}`);
  });

  pythonProcess.on("error", (err) => {
    console.error("[Server] Failed to start Python NLP Service:", err);
  });

  // Start Spring Boot Backend (if available)
  // Note: Java might not be pre-installed in this environment.
  // This is a placeholder for the user to start it manually.
  console.log("[Server] Spring Boot Backend is available in /spring-boot-backend");
  console.log("[Server] To run it, navigate to /spring-boot-backend and run 'mvn spring-boot:run'");

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;
  const PYTHON_NLP_URL = process.env.PYTHON_NLP_SERVICE_URL || "http://127.0.0.1:5000";
  const SPRING_BOOT_URL = process.env.SPRING_BOOT_BACKEND_URL || "http://127.0.0.1:8080";

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));

  // --- API ROUTES ---
  
  // File Upload Endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Try Spring Boot Backend first
    try {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname);

      const response = await fetch(`${SPRING_BOOT_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (error) {
      // Spring Boot backend not available, fall back to local Express upload
    }

    res.json({ 
      message: "File uploaded successfully", 
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });
  });

  // Codeforces Proxy (CORS Bypass)
  app.get("/api/proxy/codeforces", async (req, res) => {
    try {
      const response = await fetch('https://codeforces.com/api/problemset.problems');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Proxy Error] Codeforces:", error);
      res.status(500).json({ status: "FAILED", message: "Failed to fetch from Codeforces" });
    }
  });

  // Python NLP Health Check
  app.get("/api/nlp/health", async (req, res) => {
    // Try Spring Boot Backend first
    try {
      const response = await fetch(`${SPRING_BOOT_URL}/api/nlp/health`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (error) {
      // Spring Boot backend not available
    }

    try {
      const response = await fetch(`${PYTHON_NLP_URL}/health`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ status: "offline" });
    }
  });

  // Python NLP Proxy with Retry
  app.post("/api/nlp", async (req, res) => {
    const { text, command, context, chat_history_ids } = req.body;
    
    console.log(`[Backend Proxy] Forwarding command: ${command} to backend...`);
    
    // Try Spring Boot Backend first
    try {
      const response = await fetch(`${SPRING_BOOT_URL}/api/nlp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, command, context, chat_history_ids })
      });
      
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (error) {
      // Spring Boot backend not available
    }

    const maxRetries = 5;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const response = await fetch(`${PYTHON_NLP_URL}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, command, context, chat_history_ids })
        });
        
        if (!response.ok) {
          throw new Error(`Python service returned ${response.status}`);
        }
        
        const data = await response.json();
        return res.json(data);
      } catch (error) {
        attempt++;
        console.error(`[Python NLP Proxy] Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff or simple delay)
          await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
        } else {
          res.status(500).json({ 
            error: "Failed to connect to Python NLP service",
            result: "I'm sorry, my expert neural networks are currently offline. Please try again in a moment."
          });
        }
      }
    }
  });

  // --- WEBSOCKETS (Chat & WebRTC Signaling) ---
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a specific chat room
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Handle chat messages
    socket.on("send-message", (data) => {
      // Broadcast to everyone in the room except sender
      socket.to(data.roomId).emit("receive-message", data.message);
    });

    // WebRTC Signaling
    socket.on("call-user", (data) => {
      socket.to(data.userToCall).emit("call-made", {
        offer: data.offer,
        socket: socket.id,
        callerName: data.callerName
      });
    });

    socket.on("make-answer", (data) => {
      socket.to(data.to).emit("answer-made", {
        socket: socket.id,
        answer: data.answer
      });
    });

    socket.on("ice-candidate", (data) => {
      socket.to(data.to).emit("ice-candidate", {
        candidate: data.candidate,
        socket: socket.id
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
