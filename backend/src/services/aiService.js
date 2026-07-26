import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.GEMINI_API_KEY;
console.log("🔑 --- API KEY DEBUG CHECK ---");
console.log("Is Key Undefined?", key === undefined);
console.log("Key Length:", key ? key.length : "N/A");
console.log("Starts with:", key ? key.substring(0, 4) : "N/A");
console.log("Ends with quote?", key ? key.endsWith('"') || key.endsWith("'") : "N/A");
console.log("------------------------------");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Updated to the current stable model string
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

export const generateResumeQuestions = async (resumeText, role) => {
  try {
    const prompt = `You are an expert technical interviewer. Review the following resume text and generate exactly 10 technical interview questions tailored to the candidate's skills and projects. Return ONLY a JSON array of strings. Do not use markdown blocks. 
    Resume: ${resumeText}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    console.log("🤖 Raw Gemini Response:", text);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not find a JSON array in the response.");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    // 🔥 This will now log the EXACT reason Gemini failed (e.g., API key error, quota, or model error)
    console.error('🔥 ACTUAL Gemini Error (Generate Questions):', error.message || error);
    throw new Error('Failed to generate questions');
  }
};

export const generateHrQuestions = async (resumeText) => {
  try {
    const prompt = `You are an HR Director. Based on this resume, generate exactly 5 behavioral and situational interview questions. Return ONLY a JSON array of strings. Do not use markdown blocks.
    Resume: ${resumeText}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Could not find a JSON array in the response.");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('🔥 ACTUAL Gemini Error (HR Questions):', error.message || error);
    throw new Error('Failed to generate HR questions');
  }
};

export const evaluateBatch = async (qaList, roundType) => {
  try {
    const prompt = `You are an expert ${roundType} interviewer. Evaluate this interview transcript:
    ${JSON.stringify(qaList)}
    
    Return ONLY a valid JSON object matching this exact structure (no markdown):
    {
      "overallTechnicalScore": <number 0-100>,
      "overallCommunicationScore": <number 0-100>,
      ${roundType === 'HR' ? '"starScore": <number 0-100>,' : ''}
      "overallFeedback": "<detailed string feedback>",
      "finalVerdict": "<string e.g., 'Strong Hire', 'Reject'>",
      "questionWiseFeedback": [
        { "questionNumber": <number>, "feedback": "<string>" }
      ]
    }`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not find a JSON object in the response.");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`🔥 ACTUAL Gemini Error (Batch ${roundType}):`, error.message || error);
    throw new Error(`Failed to batch evaluate ${roundType} round`);
  }
};