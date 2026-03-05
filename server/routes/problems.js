const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// @route   GET /api/problems
// @desc    Get all problems from JSON dataset
// @access  Public
router.get('/', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../../src/Problems/final_500_real_problems_cleaned.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        let problems = JSON.parse(rawData);

        // Inject an _id onto each problem (using the index as string + 'jsonId') so the React components stop throwing missing key errors when accessing _id
        problems = problems.map((p, idx) => ({
            ...p,
            _id: `json-${idx}`
        }));

        if (req.query.limit) {
            problems = problems.slice(0, parseInt(req.query.limit));
        }

        res.json(problems);
    } catch (err) {
        console.error("Error reading problems JSON file:", err.message);
        res.status(500).send('Server error loading problems dataset');
    }
});

// @route   GET /api/problems/:id
// @desc    Get problem by ID from JSON dataset
// @access  Public
router.get('/:id', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../../src/Problems/final_500_real_problems_cleaned.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const problems = JSON.parse(rawData);

        const problemId = String(req.params.id);

        // Find problem by stripping 'json-' prefix to get the original index
        if (problemId.startsWith('json-')) {
            const index = parseInt(problemId.split('-')[1]);
            if (index >= 0 && index < problems.length) {
                const problem = { ...problems[index], _id: problemId };
                return res.json(problem);
            }
        }

        return res.status(404).json({ message: 'Problem not found in dataset' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error loader single problem');
    }
});

module.exports = router;
