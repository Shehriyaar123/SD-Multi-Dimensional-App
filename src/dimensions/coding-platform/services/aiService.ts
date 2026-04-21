import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, TestCase, CodeTemplate, Problem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiService = {
  async generateProblem(userPrompt?: string, existingProblems: Problem[] = [], category?: string, difficulty?: Difficulty) {
    try {
      const existingTitles = existingProblems.map(p => p.title).join(', ');
      
      const prompt = `
        You are an expert competitive programming problem setter for Elite Coding Arena.
        Generate a high-quality, unique coding problem.
        
        User's specific request/topic: ${userPrompt || 'Surprise me with a challenging DSA problem'}
        Preferred Category: ${category || 'Algorithms'}
        Difficulty: ${difficulty || 'Medium'}
        
        CRITICAL: Do NOT recreate any of these existing problems: ${existingTitles || 'None yet'}
        
        The problem must be completely original and follow standard competitive programming formats (like LeetCode, Codeforces, or HackerRank).
        
        The problem should include:
        1. A clear, meaningful problem statement in Markdown.
        2. Constraints, Input Format, and Output Format in Markdown.
        3. Sample Input and Output (meaningful examples).
        4. Comprehensive tags (at least 3).
        5. A detailed editorial explaining the optimal approach (Time & Space complexity included).
        6. A reference solution in Python that passes all test cases.
        7. Accurate code templates for JavaScript, Python, C++, and Java.
        8. At least 6 test cases (2 public samples, 4 hidden private cases covering edge cases).
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
              category: { type: Type.STRING },
              difficulty: { type: Type.STRING },
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
            required: ["title", "statement", "constraints", "inputFormat", "outputFormat", "sampleInput", "sampleOutput", "testCases", "referenceSolution", "codeTemplates", "category", "difficulty"]
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
  },

  async enrichProblemMetadata(title: string, tags: string[], category: string): Promise<Partial<Problem>> {
    try {
      const prompt = `
        You are an expert problem setter. I have a competitive programming problem metadata:
        Title: ${title}
        Tags: ${tags.join(', ')}
        Category: ${category}
        
        Based on this title and tags, generate a complete, high-quality problem statement, constraints, 
        sample input/output, and test cases. The logic should be consistent with the title and tags.
        
        Provide:
        1. Problem Statement (Markdown)
        2. Constraints (Markdown)
        3. Input Format (Description)
        4. Output Format (Description)
        5. Sample Input
        6. Sample Output
        7. 5 Test Cases (2 public, 3 private)
        8. Code templates for JavaScript, Python, C++, and Java.
        9. A Python reference solution.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              statement: { type: Type.STRING },
              constraints: { type: Type.STRING },
              inputFormat: { type: Type.STRING },
              outputFormat: { type: Type.STRING },
              sampleInput: { type: Type.STRING },
              sampleOutput: { type: Type.STRING },
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
              },
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
              }
            },
            required: ["statement", "constraints", "inputFormat", "outputFormat", "sampleInput", "sampleOutput", "testCases", "referenceSolution", "codeTemplates"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Enrichment Error:", error);
      return {};
    }
  }
};
