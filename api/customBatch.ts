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
    const { words } = req.body;
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: 'Missing or invalid words array' });
    }

    const cleanWords = words.map(w => String(w).trim()).filter(w => w.length > 0 && w.length < 30).slice(0, 50);
    if (cleanWords.length === 0) return res.status(200).json([]);

    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          partOfSpeech: { type: Type.STRING },
          definition: { type: Type.STRING },
          synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["word", "partOfSpeech", "definition", "synonyms"],
      }
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Provide dictionary data for these words: ${JSON.stringify(cleanWords)}`,
      config: {
        systemInstruction: "You are a friendly junior dictionary for 10-12 year olds. Always provide simple definitions and helpful synonyms. Output strictly valid JSON.",
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return res.status(200).json(JSON.parse(text));
  } catch (error: any) {
    console.error("Custom batch generation failed in API", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
