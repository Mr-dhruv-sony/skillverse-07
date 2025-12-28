
import { GoogleGenAI } from "@google/genai";
import { User } from "../types";

// Always initialize with named parameter and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIPeerInsight = async (user: User, peer: User) => {
  try {
    const prompt = `
      Act as a peer-learning coordinator. Analyze these two students:
      
      Student A: Knows [${user.knows.join(', ')}], Wants [${user.wants.join(', ')}]
      Student B: Knows [${peer.knows.join(', ')}], Wants [${peer.wants.join(', ')}]

      Provide a 1-sentence catchy description of why they are a perfect "Skill Swap" match. 
      If it's a perfect bidirectional match, highlight that. 
      If it's a one-way match where A can teach B, suggest a lesson topic.
      Keep it encouraging and minimalist.
    `;

    // Removed maxOutputTokens to prevent response blocking without thinkingBudget. 
    // Default model handling is better for simple text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "You two have complementary skills that would make for a great learning session!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The stars suggest a high compatibility for knowledge exchange between you two.";
  }
};

export const generateLessonPlan = async (skill: string) => {
  try {
    const prompt = `Create a 3-step minimalist lesson plan for a peer-to-peer 30-minute teaching session for the skill: ${skill}. Include a 'Hands-on Exercise' idea.`;
    
    // Upgrading to gemini-3-pro-preview for complex reasoning tasks like lesson planning
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Lesson Plan Error:", error);
    return "Unable to generate a plan at this moment. Start with basics and build a project together!";
  }
};
