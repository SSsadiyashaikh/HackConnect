import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    hackathon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hackathon',
        required: true
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            default: 'other'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    maxSize: {
        type: Number,
        default: 4
    },
    lookingFor: [{
        type: String
    }],
    roleCapacities: {
        type: Map,
        of: Number,
        default: {}
    },
    quizQuestions: [{
        question: String,
        options: [String],
        correctOptionIndex: Number,
        skillTag: String
    }],
    applications: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: String,
        answers: [{
            questionId: mongoose.Schema.Types.ObjectId,
            selectedIndex: Number
        }],
        score: Number,
        passed: Boolean,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    chat: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
