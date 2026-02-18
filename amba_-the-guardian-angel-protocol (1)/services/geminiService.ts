import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_SYSTEM_INSTRUCTION_WELLNESS, GEMINI_SYSTEM_INSTRUCTION_SAFETY_ANALYSIS } from '../constants';

// Initialize Gemini Client
// NOTE: In a real production app, API calls should go through a backend to protect the key.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const GEMINI_SYSTEM_INSTRUCTION_LOCATION_SAFETY = `
You are the AMBA Safety Sentinel. 
Analyze the safety of the provided location name based on general knowledge, urban safety data patterns, and typical news associated with such areas.
Return a JSON object with:
1. 'score': A number between 0-100 (100 being safest).
2. 'riskLevel': "SAFE", "MODERATE", or "HIGH_RISK".
3. 'summary': A concise 1-sentence reason based on lighting, crowd, or past incident reputation.
4. 'factors': An array of 3 short strings (e.g., ["Poor Lighting", "High Crime", "Isolated"]).
`;

export const getWellnessResponse = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  if (!apiKey) {
    return "Demo Mode: API Key not found. Please configure your API key to chat with AMBA.";
  }

  try {
    const model = 'gemini-2.5-flash-latest';
    
    // Construct chat history for the API
    const contents = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts
    }));

    // Add new message
    contents.push({ role: 'user', parts: [{ text: newMessage }] });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION_WELLNESS,
        temperature: 0.7,
      }
    });

    return response.text || "I'm here for you, but I'm having trouble connecting right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble processing that right now. Please try again.";
  }
};

export const analyzeSafetyReport = async (description: string) => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: description,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION_SAFETY_ANALYSIS,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ['SAFE', 'CAUTION', 'DANGER'] },
            analysis: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text;
    if (jsonText) {
      return JSON.parse(jsonText);
    }
    return null;
  } catch (error) {
    console.error("Safety Analysis Error:", error);
    return null;
  }
};

export const getLocationSafetyScore = async (locationName: string) => {
  // Fallback for demo if no API key
  if (!apiKey) {
    return {
      score: 78,
      riskLevel: "MODERATE",
      summary: "Demo: Moderate footfall area with average lighting.",
      factors: ["Average Lighting", "Patrolling Needed", "Crowded Day"]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: `Analyze safety for: ${locationName}`,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION_LOCATION_SAFETY,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING },
            summary: { type: Type.STRING },
            factors: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (jsonText) {
      return JSON.parse(jsonText);
    }
    return null;
  } catch (error) {
    console.error("Location Analysis Error:", error);
    return null;
  }
};
