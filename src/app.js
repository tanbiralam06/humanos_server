import express from "express";
import cors from "cors";


const app = express();

//basic configuration
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

//CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
    allowedHeaders: ["Authorization", "Content-type"],
  }),
);

// import the routes
import healthCheckRouter from './routes/healthcheck.routes.js'
import authRouter from './routes/auth.routes.js'


app.use("/api/v1/healthcheck", healthCheckRouter)
app.use("/api/v1/auth", authRouter)

app.get("/", (req, res) => {
  res.send("welcome to basecamp-api");
});

export default app;
