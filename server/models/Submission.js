const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    problem: {
        type: String, // Can be a MongoDB ObjectId or a JSON string ID like 'json-0'
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
    },
    code: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        default: 'javascript',
    },
    status: {
        type: String,
        enum: ['passed', 'failed', 'compiling'],
        default: 'compiling',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Submission', SubmissionSchema);
