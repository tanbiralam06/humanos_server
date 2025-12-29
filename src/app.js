import express from "express";
import cors from "cors";

import cookieParser from "cookie-parser";

const app = express();

//basic configuration
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:8081",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
    allowedHeaders: ["Authorization", "Content-type"],
  }),
);

// import the routes
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import profileRouter from "./routes/profile.routes.js";
import chatroomRouter from "./routes/chatroom.routes.js";
import searchRouter from "./routes/search.routes.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/chatrooms", chatroomRouter);
app.use("/api/v1/search", searchRouter);

app.get("/", (req, res) => {
  res.send("welcome to basecamp-api");
});

export default app;
