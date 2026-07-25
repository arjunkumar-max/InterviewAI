import { evaluateBatch, generateHrQuestions } from '../services/aiService.js';

export const processTechnicalBatch = async (req, res) => {
  try {
    const { qaList } = req.body;
    if (!qaList || !Array.isArray(qaList)) {
      return res.status(400).json({ message: 'Invalid QA list' });
    }

    const evaluation = await evaluateBatch(qaList, 'Technical');
    res.status(200).json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const processHrBatch = async (req, res) => {
  try {
    const { qaList } = req.body;
    if (!qaList || !Array.isArray(qaList)) {
      return res.status(400).json({ message: 'Invalid QA list' });
    }

    const evaluation = await evaluateBatch(qaList, 'HR');
    res.status(200).json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateHr = async (req, res) => {
  try {
    const { resumeText } = req.body;
    const questions = await generateHrQuestions(resumeText || "Software Engineer");
    
    // Formatting the array into the numbered string your frontend expects
    const formatted = questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n\n');
    res.status(200).json({ questions: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};