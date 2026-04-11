import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, TestCase, CodeTemplate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiService = {
  async generateProblem(title?: string, category?: string, difficulty?: Difficulty) {
    try {
      const prompt = `
        You are an expert competitive programming problem setter.
        Generate a high-quality coding problem based on the following:
        Title: ${title || 'Random Challenge'}
        Category: ${category || 'Algorithms'}
        Difficulty: ${difficulty || 'Medium'}

        The problem should include:
        1. A clear, meaningful problem statement in Markdown.
        2. Constraints, Input Format, and Output Format in Markdown.
        3. Sample Input and Output.
        4. An editorial explaining the approach.
        5. A reference solution in Python.
        6. Code templates for JavaScript, Python, C++, and Java.
        7. At least 5 test cases (some public, some private).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              statement: { type: Type.STRING },
              constraints: { type: Type.STRING },
              inputFormat: { type: Type.STRING },
              outputFormat: { type: Type.STRING },
              sampleInput: { type: Type.STRING },
              sampleOutput: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              editorial: { type: Type.STRING },
              referenceSolution: { type: Type.STRING },
              codeTemplates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    language: { type: Type.STRING },
                    template: { type: Type.STRING }
                  },
                  required: ["language", "template"]
                }
              },
              testCases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    input: { type: Type.STRING },
                    expectedOutput: { type: Type.STRING },
                    isPublic: { type: Type.BOOLEAN }
                  },
                  required: ["input", "expectedOutput", "isPublic"]
                }
              }
            },
            required: ["title", "statement", "constraints", "inputFormat", "outputFormat", "sampleInput", "sampleOutput", "testCases", "referenceSolution", "codeTemplates"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw error;
    }
  },

  async generateMoreTestCases(problemStatement: string, existingTestCases: TestCase[], count: number = 5): Promise<TestCase[]> {
    try {
      const prompt = `
        Based on the following problem statement, generate ${count} additional unique test cases.
        Problem Statement: ${problemStatement}
        Existing Test Cases: ${JSON.stringify(existingTestCases)}
        
        Return exactly ${count} new test cases that cover edge cases and large inputs.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                input: { type: Type.STRING },
                expectedOutput: { type: Type.STRING },
                isPublic: { type: Type.BOOLEAN }
              },
              required: ["input", "expectedOutput", "isPublic"]
            }
          }
        }
      });

      const newTestCases = JSON.parse(response.text);
      return newTestCases.map((tc: any) => ({
        ...tc,
        id: Math.random().toString(36).substr(2, 9)
      }));
    } catch (error) {
      console.error("AI Test Case Generation Error:", error);
      throw error;
    }
  },

  async getHint(problemStatement: string, currentCode: string, language: string): Promise<string> {
    try {
      const prompt = `
        Problem: ${problemStatement}
        User's Code (${language}):
        \`\`\`${language}
        ${currentCode}
        \`\`\`
        
        Analyze the user's progress and provide a helpful, subtle hint without giving away the full solution. 
        Focus on the logic or a potential bug they might be facing.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a helpful coding mentor. Give concise, encouraging hints."
        }
      });

      return response.text;
    } catch (error) {
      console.error("AI Hint Error:", error);
      return "I'm having trouble analyzing your code right now. Try checking your logic for edge cases!";
    }
  },

  async summarizeResource(content: string): Promise<{ summary: string, keyPoints: string[] }> {
    try {
      const prompt = `
        Summarize the following educational content. 
        Provide a concise summary and a list of key learning points.
        Content: ${content.substring(0, 10000)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "keyPoints"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Summarization Error:", error);
      throw error;
    }
  },

  async semanticSearch(query: string, resources: any[]): Promise<any[]> {
    try {
      const prompt = `
        Query: ${query}
        Resources: ${JSON.stringify(resources.map(r => ({ id: r.id, title: r.title, description: r.description })))}
        
        Rank the resources based on their relevance to the query using semantic understanding.
        Return the ranked list of resource IDs.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const rankedIds = JSON.parse(response.text);
      return rankedIds.map(id => resources.find(r => r.id === id)).filter(Boolean);
    } catch (error) {
      console.error("AI Semantic Search Error:", error);
      return resources;
    }
  }
};
