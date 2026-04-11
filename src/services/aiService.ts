import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getAI() {
  if (!aiInstance) {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. AI features may not work.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiInstance;
}

export async function askGemini(prompt: string, mode: 'flash' | 'pro' | 'flash-lite' = 'flash', useSearch = false, useMaps = false) {
  const ai = getAI();
  const modelName = mode === 'pro' ? 'gemini-3.1-pro-preview' : mode === 'flash-lite' ? 'gemini-3.1-flash-lite-preview' : 'gemini-3-flash-preview';
  
  const config: any = {};
  
  if (mode === 'pro') {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  } else if (useMaps) {
    config.tools = [{ googleMaps: {} }];
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config
  });

  return response.text;
}

export async function chatWithGemini(history: {role: 'user' | 'model', parts: {text: string}[]}[], mode: 'flash' | 'pro' | 'flash-lite' = 'flash', useSearch = false, useMaps = false) {
  const ai = getAI();
  const modelName = mode === 'pro' ? 'gemini-3.1-pro-preview' : mode === 'flash-lite' ? 'gemini-3.1-flash-lite-preview' : 'gemini-3-flash-preview';
  
  const config: any = {};
  
  if (mode === 'pro') {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  } else if (useMaps) {
    config.tools = [{ googleMaps: {} }];
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: history,
    config
  });

  return response.text;
}

export async function performNLPTask(task: 'summarize' | 'sentiment' | 'keywords' | 'grammar', text: string) {
  const prompts = {
    summarize: `Summarize the following text concisely:\n\n${text}`,
    sentiment: `Analyze the sentiment of the following text. Respond with the overall sentiment (e.g., Positive, Negative, Neutral) and a brief explanation:\n\n${text}`,
    keywords: `Extract the key entities and keywords from the following text as a comma-separated list:\n\n${text}`,
    grammar: `Check the following text for grammar and spelling errors. Provide the corrected text and briefly explain the changes:\n\n${text}`
  };

  return await askGemini(prompts[task], 'flash');
}

export async function translateText(text: string, targetLanguage: string) {
  const prompt = `Translate the following text to ${targetLanguage}. 
  Provide ONLY the translated text, no extra explanations or quotes.
  
  Text to translate:
  ${text}`;

  return await askGemini(prompt, 'flash');
}

export async function transcribeAudio(base64Audio: string, mimeType: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        inlineData: {
          data: base64Audio,
          mimeType: mimeType
        }
      },
      "Transcribe this audio exactly as spoken."
    ]
  });
  return response.text;
}

export async function textToSpeech(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
}
