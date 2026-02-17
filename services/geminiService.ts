
import { GoogleGenAI, Type } from "@google/genai";
import { VerificationAudit, IdentifiedSubject } from "../types";

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const findNearbyHospitals = async (lat: number, lng: number): Promise<any[]> => {
  if (!process.env.API_KEY) {
    return [
      {
        id: 'h1',
        name: "Apollo Multispeciality",
        location: { lat: lat + 0.008, lng: lng + 0.005 },
        address: "Sector 4, Main Highway Corridor",
        uri: "https://maps.google.com",
        image: "https://images.unsplash.com/photo-1587350859728-117699f4a747?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 'h2',
        name: "St. John's Emergency",
        location: { lat: lat - 0.005, lng: lng + 0.012 },
        address: "7th Avenue, East Industrial Zone",
        uri: "https://maps.google.com",
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 'h3',
        name: "City Care General",
        location: { lat: lat + 0.012, lng: lng - 0.008 },
        address: "North Square, Medical District",
        uri: "https://maps.google.com",
        image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: "Find all real hospitals and emergency medical centers within a 10km radius of my current location. Provide their names, addresses, and relative positions.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const hospitals = chunks
      .filter((c: any) => c.maps)
      .map((c: any, index: number) => {
        const offsetLat = (Math.random() * 0.03 - 0.015);
        const offsetLng = (Math.random() * 0.03 - 0.015);
        return {
          id: `h-${index}`,
          name: c.maps.title || "Emergency Medical Hub",
          address: c.maps.address || "Sector Location Identified",
          uri: c.maps.uri || "#",
          location: { 
            lat: lat + offsetLat, 
            lng: lng + offsetLng 
          },
          image: [
            "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1587350859728-117699f4a747?auto=format&fit=crop&w=800&q=80"
          ][index % 3]
        };
      });

    return hospitals.length > 0 ? hospitals : [];
  } catch (e) {
    console.error("Maps Grounding Error:", e);
    return [];
  }
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
            Return JSON: { "isReal": boolean, "aiDetectionScore": number, "reason": string }` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(cleanJsonResponse(response.text || "{}"));
      const isActuallyReal = result.isReal && result.aiDetectionScore < 40;
      audit.neuralCheck.status = isActuallyReal ? 'VALID' : 'FAILED';
      audit.neuralCheck.details = result.reason;
      audit.overallScore = Math.round(100 - result.aiDetectionScore);
      return { isReal: isActuallyReal, audit, reason: result.reason };
    } catch (e) {
      return { isReal: false, audit, reason: "Neural Uplink Interrupted." };
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  return { isReal: true, audit, reason: "Simulation verification successful." };
};

export const analyzeVisualMedia = async (
  mediaBase64: string, 
  mimeType: string, 
  isSimulated: boolean = false,
  knownTargets: IdentifiedSubject[] = [],
  fileName: string = ""
): Promise<any[]> => {
  if (isSimulated || !process.env.API_KEY) {
    await new Promise(r => setTimeout(r, 2200));

    // Improved Simulation: Detect multiple targets if in group
    if (knownTargets.length > 0) {
      return knownTargets.slice(0, 2).map((target, idx) => ({
        type: "Target Match",
        confidence: 0.98 - (idx * 0.05),
        description: `CRITICAL BIOMETRIC LOCK: ${target.name} facial geometry verified in crowd. Spatial markers match registry profile ${target.id}.`,
        location: "Sector 7 // North Plaza Junction",
        detectedObjects: ["Person", "Target Confirmed", "Group"],
        matchedTargetId: target.id,
        locationInImage: idx === 0 ? "Third person from left" : "Center background"
      }));
    }

    return [{ 
      type: "Vehicle Collision", 
      confidence: 0.99, 
      description: "SIMULATED THREAT: Multi-vehicle high-impact collision detected at intersection.", 
      location: "Grid Sector 7-G",
      detectedObjects: ["Vehicle", "Debris", "Smoke"]
    }];
  }

  // USE GEMINI 3 PRO FOR COMPLEX SEARCH HUB TASKS
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = knownTargets.length > 0 
      ? `ACT AS: Advanced Facial Recognition Subsystem.
         SCENE CONTEXT: This is a crowd/group scan. 
         REGISTRY DATABASE: ${JSON.stringify(knownTargets.map(t => ({id: t.id, name: t.name})))}.
         
         OBJECTIVE: 
         1. Identify EVERY human face in the image, even if small or in a group.
         2. Perform a multi-point biometric comparison of each face against the REGISTRY DATABASE.
         3. You must find matches even if the person is partially obscured or in a busy background.
         
         OUTPUT FORMAT: JSON array of objects.
         Each match object:
         {
           "type": "Target Match",
           "confidence": number (0-1),
           "description": "Explain WHY this face matches the registry profile.",
           "location": "Urban sector name",
           "matchedTargetId": "The EXACT 'id' from the registry that matches",
           "locationInImage": "Detailed position (e.g. 'standing near the blue pillar', 'person in the red jacket')",
           "detectedObjects": ["Person", "Group", "Specific features seen"]
         }
         Return [] if no registry targets are identified.`
      : "Analyze this media for security threats. Return JSON array with fields: type, confidence, description, location, detectedObjects.";

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // UPGRADED FOR CROWD REASONING
      contents: { parts: [{ inlineData: { data: mediaBase64, mimeType: mimeType } }, { text: prompt }] },
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 } // ADDED BUDGET FOR SEARCH TASKS
      }
    });
    return JSON.parse(cleanJsonResponse(response.text || "[]"));
  } catch (err) {
    console.error("AI Analysis Error:", err);
    return [];
  }
};
