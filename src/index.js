import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import connectDB from "./db/index.js";
import { initializeSocket } from "./socket/socket.js";
import { startCleanupService } from "./services/cleanup.service.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Socket.io is ready for connections`);

      // Start cleanup service
      startCleanupService();
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });
