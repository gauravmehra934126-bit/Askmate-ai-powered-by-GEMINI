import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const getGeminiResponse = async (messages) => {
  try {
    // Convert MongoDB messages to Gemini format
    const contents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: msg.content,
        },
      ],
    }));

    const response = await ai.models.generateContent({
      model: "models/gemini-3.5-flash",
      contents,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return "Sorry, I couldn't generate a response.";
  }
};

export default getGeminiResponse;
