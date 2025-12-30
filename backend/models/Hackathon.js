import mongoose from 'mongoose';

const hackathonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    registrationDeadline: {
        type: Date,
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    maxParticipants: {
        type: Number
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to update status based on date
hackathonSchema.methods.updateStatus = function () {
    const now = new Date();
    if (now < this.startDate) {
        this.status = 'upcoming';
    } else if (now >= this.startDate && now <= this.endDate) {
        this.status = 'ongoing';
    } else {
        this.status = 'completed';
    }
    return this.save();
};

const Hackathon = mongoose.model('Hackathon', hackathonSchema);

export default Hackathon;
