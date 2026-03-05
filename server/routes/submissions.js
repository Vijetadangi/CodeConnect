const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Profile = require('../models/Profile');
const { protect } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

// @route   POST /api/submissions
// @desc    Submit a solution
// @access  Private
router.post('/', protect, async (req, res) => {
    const { problem_id, code, language, status, type } = req.body;

    try {
        const submissionData = {
            user: req.user.id,
            code,
            language,
            status,
            problem: problem_id, // Save the string ID directly
            type: type || 'problem'
        };

        if (type === 'challenge') {
            submissionData.challenge = problem_id;
            delete submissionData.problem;
        }

        const submission = new Submission(submissionData);
        await submission.save();

        if (status === 'passed') {
            const profile = await Profile.findOne({ user: req.user.id });
            let problemDoc = null;

            if (type === 'challenge') {
                const Challenge = require('../models/Challenge');
                problemDoc = await Challenge.findById(problem_id);
            } else {
                // If it's a JSON problem, find it in the file
                const filePath = path.join(__dirname, '../../src/Problems/final_500_real_problems_cleaned.json');
                const rawData = fs.readFileSync(filePath, 'utf8');
                const problems = JSON.parse(rawData);

                if (String(problem_id).startsWith('json-')) {
                    const index = parseInt(String(problem_id).split('-')[1]);
                    if (index >= 0 && index < problems.length) {
                        problemDoc = { ...problems[index], _id: problem_id };
                    }
                }
            }

            if (profile && problemDoc) {
                // Check if already solved
                const query = {
                    user: req.user.id,
                    status: 'passed',
                    _id: { $ne: submission._id }
                };

                if (type === 'challenge') {
                    query.challenge = problem_id;
                } else {
                    query.problem = problem_id;
                }

                const existingPassed = await Submission.findOne(query);

                if (!existingPassed) {
                    let coinsToAdd = 10;
                    const diff = (problemDoc.difficulty || 'Easy').toLowerCase();

                    if (diff === 'medium') coinsToAdd = 25;
                    else if (diff === 'hard') coinsToAdd = 50;

                    profile.coins += coinsToAdd;
                    await profile.save();

                    // Create Notification
                    try {
                        const Notification = require('../models/Notification');
                        await new Notification({
                            recipient: req.user.id,
                            type: 'coin_reward',
                            title: problemDoc.title || "Problem Solved",
                            message: type === 'challenge' ? "Company Challenge" : "Practice Problem",
                            metadata: { coins: coinsToAdd, problemId: problem_id }
                        }).save();
                    } catch (notifErr) {
                        console.error("Notification failed:", notifErr.message);
                    }

                    return res.json({ submission, coinsAwarded: coinsToAdd });
                }
            }
        }

        res.json({ submission, coinsAwarded: 0 });
    } catch (err) {
        console.error("Submission Error:", err.message);
        res.status(500).send('Server error processing submission');
    }
});

// @route   GET /api/submissions/my
// @desc    Get current user submissions
// @access  Private
router.get('/my', protect, async (req, res) => {
    try {
        const submissions = await Submission.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate('challenge', ['title', 'difficulty']);

        // Manually "populate" practice problems from JSON
        const filePath = path.join(__dirname, '../../src/Problems/final_500_real_problems_cleaned.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const problems = JSON.parse(rawData);

        const enhancedSubmissions = submissions.map(sub => {
            const subObj = sub.toObject();
            if (subObj.problem && String(subObj.problem).startsWith('json-')) {
                const index = parseInt(String(subObj.problem).split('-')[1]);
                if (index >= 0 && index < problems.length) {
                    subObj.problem = {
                        _id: subObj.problem,
                        title: problems[index].title,
                        difficulty: problems[index].difficulty
                    };
                }
            }
            return subObj;
        });

        res.json(enhancedSubmissions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Helper to calculate stats
const calculateStats = (submissions, problems) => {
    const solvedMap = new Map();
    submissions.forEach(sub => {
        const probId = sub.problem || (sub.challenge ? sub.challenge._id.toString() : null);
        if (!probId) return;

        let difficulty = 'Easy';
        if (sub.challenge && sub.challenge.difficulty) {
            difficulty = sub.challenge.difficulty;
        } else if (String(probId).startsWith('json-')) {
            const index = parseInt(String(probId).split('-')[1]);
            if (index >= 0 && index < problems.length) {
                difficulty = problems[index].difficulty;
            }
        }
        solvedMap.set(probId.toString(), difficulty);
    });

    const stats = { total: solvedMap.size, easy: 0, medium: 0, hard: 0 };
    solvedMap.forEach(diff => {
        const d = (diff || 'Easy').toLowerCase();
        if (stats[d] !== undefined) stats[d]++;
    });
    return stats;
};

// @route   GET /api/submissions/stats
// @desc    Get user stats (solved counts)
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        const submissions = await Submission.find({ user: req.user.id, status: 'passed' })
            .populate('challenge', 'difficulty');

        const filePath = path.join(__dirname, '../../src/Problems/final_500_real_problems_cleaned.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const problems = JSON.parse(rawData);

        const stats = calculateStats(submissions, problems);
        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/submissions/stats/:userId
// @desc    Get user stats by user ID
// @access  Public
router.get('/stats/:userId', async (req, res) => {
    try {
        const submissions = await Submission.find({ user: req.params.userId, status: 'passed' })
            .populate('challenge', 'difficulty');

        const filePath = path.join(__dirname, '../../src/Problems/final_500_real_problems_cleaned.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const problems = JSON.parse(rawData);

        const stats = calculateStats(submissions, problems);
        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
