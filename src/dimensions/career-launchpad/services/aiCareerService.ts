import { GoogleGenAI } from "@google/genai";
import { ResumeData, ResumeAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiCareerService = {
  async refineBulletPoint(htmlContent: string, role: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Transform this resume experience description into high-impact, achievement-oriented bullet points for a ${role} role. 
      Original HTML:
      ${htmlContent}
      
      Instructions:
      1. Use the STAR method or focus on quantifiable results.
      2. Keep it concise and professional.
      3. Return ONLY valid HTML (e.g., <ul><li>...</li></ul>) without any markdown formatting or code blocks.`,
    });
    let refined = response.text?.trim() || htmlContent;
    if (refined.startsWith('```html')) {
      refined = refined.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    }
    return refined;
  },

  async analyzeResume(resume: ResumeData, jobDescription: string): Promise<ResumeAnalysis> {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Analyze this resume against the following job description.
      
      Resume Data: ${JSON.stringify(resume)}
      Job Description: ${jobDescription}
      
      Provide a JSON response with:
      - score: overall match score (0-100)
      - missingKeywords: list of important keywords from the job description missing in the resume
      - suggestions: specific advice to improve the resume for this role
      - atsCompatibility: { score: 0-100, issues: list of potential ATS issues }
      
      Return ONLY valid JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return { score: 0, missingKeywords: [], suggestions: [], atsCompatibility: { score: 0, issues: [] } };
    }
  },

  async generateInterviewQuestions(role: string, company: string): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 challenging interview questions for a ${role} position at ${company}. 
      Include a mix of behavioral (STAR method) and technical/role-specific questions.
      Return as a simple list of strings.`,
    });
    return response.text?.split('\n').filter(q => q.trim()).map(q => q.replace(/^\d+\.\s*/, '').trim()) || [];
  },

  async evaluateInterviewResponse(question: string, answer: string): Promise<{ feedback: string, sentiment: string, starScore: number }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evaluate this interview response.
      Question: ${question}
      Answer: ${answer}
      
      Provide:
      - feedback: constructive criticism and how to improve
      - sentiment: the overall tone (e.g., confident, hesitant, professional)
      - starScore: score (1-5) based on how well they used the STAR method (Situation, Task, Action, Result)
      
      Return ONLY valid JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { feedback: "Could not evaluate.", sentiment: "Neutral", starScore: 0 };
    }
  },

  async optimizeLinkedIn(resume: ResumeData): Promise<{ headline: string, about: string }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this resume, suggest a high-impact LinkedIn headline and a compelling 'About' section.
      Resume: ${JSON.stringify(resume)}
      
      Return ONLY valid JSON with 'headline' and 'about' fields.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { headline: "", about: "" };
    }
  },

  async skillGapAnalysis(resume: ResumeData, targetRole: string): Promise<{ missingSkills: string[], recommendedCertifications: string[], suggestedProjects: string[] }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Compare this resume to the requirements for a ${targetRole} role.
      Resume: ${JSON.stringify(resume)}
      
      Identify:
      - missingSkills: skills the user should learn
      - recommendedCertifications: relevant certifications
      - suggestedProjects: projects that would demonstrate the missing skills
      
      Return ONLY valid JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { missingSkills: [], recommendedCertifications: [], suggestedProjects: [] };
    }
  },

  async getCareerAdvice(resume: ResumeData): Promise<{ summary: string, actionItems: string[], marketOutlook: string }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert AI Career Coach. Analyze this user's resume and provide personalized career advice.
      Resume: ${JSON.stringify(resume)}
      
      Provide:
      - summary: A brief, encouraging summary of their current standing (max 2 sentences).
      - actionItems: 3-5 specific, actionable steps they should take next (e.g., "Learn React", "Update LinkedIn headline").
      - marketOutlook: A brief insight into the job market for their primary skills.
      
      Return ONLY valid JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { 
        summary: "Your resume is a great start! Let's work on making it even better.", 
        actionItems: ["Add more quantifiable achievements", "Tailor your summary to your target role"], 
        marketOutlook: "The job market is competitive but growing for skilled professionals." 
      };
    }
  }
};
