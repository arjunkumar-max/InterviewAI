import pdfParse from 'pdf-extraction';
import { generateResumeQuestions } from '../services/aiService.js';

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    // 1. Parse PDF Buffer to Text using the modern package
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;
    
    console.log("✅ PDF Parsed Successfully! Character count:", resumeText.length);

    // 2. Generate Questions via Gemini
    const questions = await generateResumeQuestions(resumeText, req.body.role || 'Software Engineer');

    // 3. Send back the text and the questions
    res.status(200).json({
      resumeText,
      skills_questions: questions.slice(0, 5),
      project_questions: questions.slice(5, 10)
    });
  } catch (error) {
    console.error("Resume Parse/AI Error:", error);
    res.status(500).json({ message: 'SERVER_BUSY' }); 
  }
};