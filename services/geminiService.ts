
import { GoogleGenAI, Type } from "@google/genai";
import { Incident } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "SIMULATED_KEY" });

const MOCK_INCIDENTS: Partial<Incident>[] = [
  {
    type: "Vehicle Collision",
    confidence: 0.98,
    timestamp: "0:02",
    location: "Downtown Intersection - Grid 4",
    description: "CRITICAL: High-velocity impact detected between two vehicles. System has flagged this as the primary emergency event.",
    detectedObjects: ["Silver Sedan", "Black SUV", "Pedestrian"]
  },
  {
    type: "Women Safety",
    confidence: 0.94,
    timestamp: "0:05",
    location: "North Parking Complex - Level 2",
    description: "CRITICAL: Behavioral pattern identified as 'Persistent Following'. Aggressive approach vector detected in isolated zone.",
    detectedObjects: ["Female Subject", "Following Male Entity"]
  },
  {
    type: "Thief / Robbery",
    confidence: 0.91,
    timestamp: "0:08",
    location: "Retail Corridor East",
    description: "CRITICAL: Sudden motion spike and erratic exit vector identified. Larceny event in progress.",
    detectedObjects: ["Store Front", "Suspect Entity"]
  }
];

export const analyzeVideoFootage = async (videoBase64: string, mimeType: string, isSimulated: boolean = false): Promise<Partial<Incident>[]> => {
  if (isSimulated || !process.env.API_KEY || process.env.API_KEY === "SIMULATED_KEY") {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return exactly ONE random incident
        const singleIncident = MOCK_INCIDENTS[Math.floor(Math.random() * MOCK_INCIDENTS.length)];
        resolve([singleIncident]);
      }, 2500);
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: videoBase64, mimeType: mimeType } },
          { text: "Analyze this surveillance footage. Identify ONLY the single most critical public safety threat. Return as a JSON array containing exactly one incident object." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          minItems: 1,
          maxItems: 1,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              timestamp: { type: Type.STRING },
              description: { type: Type.STRING },
              location: { type: Type.STRING },
              detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["type", "confidence", "timestamp", "description", "location"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.warn("AI Backend failed, falling back to Simulation Mode.");
    return [MOCK_INCIDENTS[0]];
  }
};
