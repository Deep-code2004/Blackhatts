import { GoogleGenAI, Type } from "@google/genai";
import { AlertSeverity, CrowdMetric, AIAnalysisResponse } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const getCrowdAnalysis = async (metrics: CrowdMetric[], activeAlerts: string[]): Promise<AIAnalysisResponse> => {
  const prompt = `Analyze the following crowd metrics and active alerts for a major temple gathering. Predict stampede risks and provide specific security recommendations.
  
  Metrics: ${JSON.stringify(metrics)}
  Active Alerts: ${JSON.stringify(activeAlerts)}
  
  Focus on identifying bottlenecks and dangerous density thresholds (>4 people/sqm).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              enum: Object.values(AlertSeverity),
              description: "The overall risk level calculated from metrics."
            },
            prediction: {
              type: Type.STRING,
              description: "Short summary of the predicted situation in the next 15-30 minutes."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of actionable steps for security personnel."
            }
          },
          required: ["riskLevel", "prediction", "recommendations"]
        }
      }
    });

    // Extract text directly from the response object property .text (not a method).
    const text = response.text || '{}';
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return {
      riskLevel: AlertSeverity.LOW,
      prediction: "Unable to process real-time AI prediction. Relying on manual thresholds.",
      recommendations: ["Ensure all exit routes are clear.", "Deploy additional personnel to bottlenecks."]
    };
  }
};
