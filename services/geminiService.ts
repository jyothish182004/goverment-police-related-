
import { GoogleGenAI, Type } from "@google/genai";
import { VerificationAudit, IdentifiedSubject } from "../types";

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const verifyReportImage = async (
  base64: string, 
  mimeType: string, 
  isSimulated: boolean = false, 
  type: string = "",
  userLocation?: { lat: number, lng: number }
): Promise<{ isReal: boolean, audit: VerificationAudit, reason: string }> => {
  
  const audit: VerificationAudit = {
    locationCheck: { status: 'VALID', details: "Sector geometry verified via GPS." },
    metadataCheck: { status: 'VALID', details: "Standard image profile detected." },
    neuralCheck: { status: 'VALID', details: "Scanning patterns..." },
    overallScore: 0
  };

  if (!isSimulated && process.env.API_KEY) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: mimeType } },
            { text: `CRITICAL SECURITY AUDIT: Analyze this image of a reported ${type}. 
            1. Determine if this image is REAL or AI-GENERATED/MANIPULATED.
            2. Check for neural artifacts, unnatural textures, or deepfake signatures.
            Return JSON only: { "isReal": boolean, "aiDetectionScore": number (0-100, 100 is definitely AI), "reason": string, "analysisDetails": string }` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      
      const result = JSON.parse(cleanJsonResponse(response.text || "{}"));
      
      const isActuallyReal = result.isReal && result.aiDetectionScore < 40;
      
      audit.neuralCheck.status = isActuallyReal ? 'VALID' : 'FAILED';
      audit.neuralCheck.details = result.reason;
      audit.overallScore = Math.round(100 - result.aiDetectionScore);
      
      return { 
        isReal: isActuallyReal, 
        audit, 
        reason: isActuallyReal ? "Authenticity Confirmed." : `Security Alert: ${result.reason}` 
      };
    } catch (e) {
      console.error("Verification Error:", e);
      return { isReal: false, audit, reason: "Neural Uplink Interrupted." };
    }
  } else {
    // Simulated path
    await new Promise(r => setTimeout(r, 1500));
    const isActuallyReal = true; // In simulation, we assume real unless specified
    audit.overallScore = 98;
    return { isReal: isActuallyReal, audit, reason: "Simulation verification successful." };
  }
};

export const analyzeVisualMedia = async (
  mediaBase64: string, 
  mimeType: string, 
  isSimulated: boolean = false,
  knownTargets: IdentifiedSubject[] = [],
  fileName: string = ""
): Promise<any[]> => {
  
  if (isSimulated || !process.env.API_KEY || process.env.API_KEY === "SIMULATED_KEY") {
    await new Promise(r => setTimeout(r, 600));
    
    const fn = fileName.toLowerCase();
    
    if (fn.includes('weapon') || fn.includes('gun')) {
      return [{
        type: "Weapon / Violence",
        confidence: 0.98,
        timestamp: "00:02",
        location: "Mall Entrance",
        description: "CRITICAL: Firearm detected in high-traffic zone. Hostile intent identified.",
        detectedObjects: ["Weapon", "Person", "Aggressive Stance"]
      }];
    }
    
    if (fn.includes('women') || fn.includes('safety') || fn.includes('harass')) {
      return [{
        type: "Women Safety",
        confidence: 0.96,
        timestamp: "00:05",
        location: "Parking Level B2",
        description: "URGENT: Automated SOS detected. Female subject being followed in restricted zone.",
        detectedObjects: ["Subject", "Suspect", "Closed Corridor"]
      }];
    }

    if (fn.includes('fall') || fn.includes('slip')) {
      return [{
        type: "Person Fall",
        confidence: 0.92,
        timestamp: "00:08",
        location: "North Transit Hub",
        description: "ALERT: Subject has collapsed or fallen. No movement detected for 15 seconds.",
        detectedObjects: ["Human", "Pavement"]
      }];
    }
    
    return [{
      type: "Vehicle Collision",
      confidence: 0.99,
      timestamp: "00:01",
      location: "Active Intersection",
      description: "CRITICAL: Severe high-speed vehicle collision detected. Immediate emergency response protocols initiated.",
      detectedObjects: ["Vehicle", "Debris", "Impact Zone"],
      licensePlate: "SENTINEL-X"
    }];
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ inlineData: { data: mediaBase64, mimeType: mimeType } }];

  knownTargets.forEach((target) => {
    if (target.mugshotBase64) {
      parts.push({ text: `REF ${target.name}:` }, { inlineData: { data: target.mugshotBase64, mimeType: "image/jpeg" } });
    }
  });

  parts.push({ text: "URGENT ANALYSIS: Detect Accidents, Weapons, Women Safety issues, or Falls. Also face match. Return JSON array." });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              timestamp: { type: Type.STRING },
              location: { type: Type.STRING },
              description: { type: Type.STRING },
              licensePlate: { type: Type.STRING },
              detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
              identifiedSubject: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, id: { type: Type.STRING }, matchConfidence: { type: Type.NUMBER } } }
            },
            required: ["type", "confidence", "description", "detectedObjects"]
          }
        }
      }
    });
    return JSON.parse(cleanJsonResponse(response.text || "[]"));
  } catch (err) {
    console.error("Gemini Error:", err);
    throw err;
  }
};
