import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import User from "./models/User.js";
import { verifyToken } from "./middleware/auth.js";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_here";

// --- MIDDLEWARE ---
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// --- AUTH ROUTES ---
app.post("/api/auth/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already exists." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email or password." });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid email or password." });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "3d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            maxAge: 3 * 24 * 60 * 60 * 1000
        }).json({ message: "Logged in successfully", username: user.username });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token").json({ message: "Logged out successfully" });
});

// --- PROTECTED CHAT ROUTES ---
app.use("/api", verifyToken, chatRoutes);

app.get("/", (req, res) => {
  res.send("🚀 AskMate AI Backend is Running...");
});

// --- SERVER CONNECTION ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");
  } catch (error) {
    console.log("❌ Failed to connect to database:", error.message);
  }
};

app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
});