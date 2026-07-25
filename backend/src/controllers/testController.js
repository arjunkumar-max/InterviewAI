import TestHistory from '../models/TestHistory.js';

// @desc    Get user test history
// @route   GET /api/tests
export const getTestHistory = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const history = await TestHistory.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save a new test result
// @route   POST /api/tests
export const saveTestResult = async (req, res) => {
  try {
    const { role, score, feedback, interviewType } = req.body;

    const testResult = await TestHistory.create({
      user: req.user._id,
      role,
      score,
      feedback,
      interviewType
    });

    res.status(201).json(testResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};