import { GoogleGenAI, Type, Schema } from "@google/genai";

const MODEL_NAME = "gemini-3-flash-preview";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.gemini_api_key || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const { word, sentence } = req.body;
    if (!word || !sentence) {
      return res.status(400).json({ error: 'Missing word or sentence' });
    }

    const evaluationSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Rating from 1 to 5 stars" },
        feedback: { type: Type.STRING, description: "A friendly, encouraging note about the sentence." },
        correction: { type: Type.STRING, description: "A grammatically corrected version of the sentence, if needed. Otherwise, empty string." },
        betterExamples: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Exactly two creative and high-quality example sentences using the target word." 
        }
      },
      required: ["score", "feedback", "betterExamples"],
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Word: "${word}"\nStudent's Sentence: "${sentence}"`,
      config: {
        systemInstruction: `You are a supportive and professional English writing coach for students aged 10-12. 
        Your goal is to provide constructive feedback on their use of vocabulary and grammar.
        RULES:
        1. Always be encouraging.
        2. Score from 1 to 5 (5 is perfect).
        3. ALWAYS provide exactly two 'betterExamples' showing creative use of the word.
        4. If there is a grammatical error, provide a 'correction'.
        5. If the sentence is perfect, celebrate their creativity in 'feedback'.
        6. Do not refuse to answer. If the sentence is confusing, give a 1-star and explain why nicely.`,
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    return res.status(200).json(JSON.parse(text));
  } catch (error: any) {
    console.error("Evaluation error in API:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
