import express from "express";
import Thread from "../models/Thread.js";
import getGeminiResponse from "../utils/gemini.js";

const router = express.Router();

// =======================
// Get All Threads (User Specific)
// =======================
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(threads);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// =======================
// Get Single Thread (User Specific)
// =======================
router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId, userId: req.user.id });

    if (!thread) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    res.json(thread.messages);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Failed to fetch chat",
    });
  }
});

// =======================
// Delete Thread (User Specific)
// =======================
router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId, userId: req.user.id });

    if (!deletedThread) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    res.json({
      success: "Thread deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

// =======================
// Chat Route (User Specific)
// =======================
router.post("/chat", async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    let thread = await Thread.findOne({ threadId, userId: req.user.id });

    if (!thread) {
      thread = new Thread({
        userId: req.user.id,
        threadId,
        title: message,
        messages: [],
      });
    }

    // Save user's message
    thread.messages.push({
      role: "user",
      content: message,
    });

    // Generate Gemini response
    const assistantReply = await getGeminiResponse(thread.messages);

    // Save Gemini response
    thread.messages.push({
      role: "assistant",
      content: assistantReply,
    });

    thread.updatedAt = new Date();

    await thread.save();

    res.json({
      reply: assistantReply,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

export default router;